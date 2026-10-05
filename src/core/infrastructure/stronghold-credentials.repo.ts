import type {
  Credential,
  SigaaCredentials,
  Aprender3Credentials,
  TeamsCredentials,
  AllPlatformCredentials,
} from '../domain/entities/credential';
import type { PlatformType } from '../domain/entities/feed-item';
import type { Stronghold, Client } from '@tauri-apps/plugin-stronghold';
import type { ICredentialsRepository } from '../domain/interfaces/credentials-repo.interface';

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

let sharedInMemoryStore: AllPlatformCredentials = {};
let sharedCachedStronghold: Stronghold | null = null;
let sharedCachedClient: Client | null = null;

export class StrongholdCredentialsRepository implements ICredentialsRepository {
  private vaultPassword = 'unb-aggregator-internal-vault-key';

  private async getStore() {
    if (!isTauriEnvironment()) return null;
    try {
      if (sharedCachedClient && sharedCachedStronghold) {
        const stronghold = sharedCachedStronghold;
        const client = sharedCachedClient;
        return {
          store: client.getStore(),
          saveVault: async () => stronghold.save(),
        };
      }

      const { Stronghold } = await import('@tauri-apps/plugin-stronghold');
      const { appLocalDataDir } = await import('@tauri-apps/api/path');

      const dataDir = await appLocalDataDir();
      const vaultPath = `${dataDir}/unb_vault.hold`;

      let stronghold = sharedCachedStronghold;
      if (!stronghold) {
        stronghold = await Stronghold.load(vaultPath, this.vaultPassword);
        sharedCachedStronghold = stronghold;
      }

      let client = sharedCachedClient;
      if (!client) {
        try {
          client = await stronghold.loadClient('unb_credentials');
        } catch {
          try {
            client = await stronghold.createClient('unb_credentials');
          } catch {
            try {
              client = await stronghold.loadClient('unb_credentials');
            } catch {
              client = null;
            }
          }
        }
        sharedCachedClient = client;
      }

      if (!client) return null;

      return {
        store: client.getStore(),
        saveVault: async () => {
          try {
            await stronghold.save();
          } catch (saveErr) {
            console.warn('Falha ao salvar snapshot do Stronghold:', saveErr);
            sharedCachedClient = null;
            sharedCachedStronghold = null;
          }
        },
      };
    } catch (e) {
      sharedCachedClient = null;
      sharedCachedStronghold = null;
      console.warn('Erro ao conectar com Stronghold nativo, usando isolamento em memória:', e);
      return null;
    }
  }

  private cleanLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('senha');
      window.localStorage.removeItem('credentials');
      window.localStorage.removeItem('sigaa_senha');
      window.localStorage.removeItem('aprender3_senha');
      window.localStorage.removeItem('moodlemat_senha');
    }
  }

  // --- SIGAA (Matrícula e Senha) ---
  async saveSigaa(credentials: SigaaCredentials): Promise<void> {
    this.cleanLocalStorage();
    sharedInMemoryStore.sigaa = { ...credentials };

    const vault = await this.getStore();
    if (vault) {
      try {
        const encoder = new TextEncoder();
        await vault.store.insert('sigaa_matricula', Array.from(encoder.encode(credentials.matricula)));
        await vault.store.insert('sigaa_senha', Array.from(encoder.encode(credentials.senha)));
        await vault.saveVault();
      } catch (e) {
        console.warn('Erro ao persistir no Stronghold:', e);
      }
    }
  }

  async getSigaa(): Promise<SigaaCredentials | null> {
    const vault = await this.getStore();
    if (vault) {
      try {
        const matBytes = await vault.store.get('sigaa_matricula');
        const passBytes = await vault.store.get('sigaa_senha');
        if (matBytes && passBytes) {
          const decoder = new TextDecoder();
          const creds = {
            matricula: decoder.decode(new Uint8Array(matBytes)),
            senha: decoder.decode(new Uint8Array(passBytes)),
          };
          sharedInMemoryStore.sigaa = creds;
          return creds;
        }
      } catch {
        // Fallback para memória
      }
    }
    return sharedInMemoryStore.sigaa ? { ...sharedInMemoryStore.sigaa } : null;
  }

  // --- APRENDER 3 (CPF e Senha) ---
  async saveAprender3(credentials: Aprender3Credentials): Promise<void> {
    this.cleanLocalStorage();
    sharedInMemoryStore.aprender3 = { ...credentials };

    const vault = await this.getStore();
    if (vault) {
      try {
        const encoder = new TextEncoder();
        await vault.store.insert('aprender3_cpf', Array.from(encoder.encode(credentials.cpf)));
        await vault.store.insert('aprender3_senha', Array.from(encoder.encode(credentials.senha)));
        await vault.saveVault();
      } catch (e) {
        console.warn('Erro ao persistir no Stronghold:', e);
      }
    }
  }

  async getAprender3(): Promise<Aprender3Credentials | null> {
    const vault = await this.getStore();
    if (vault) {
      try {
        const cpfBytes = await vault.store.get('aprender3_cpf');
        const passBytes = await vault.store.get('aprender3_senha');
        if (cpfBytes && passBytes) {
          const decoder = new TextDecoder();
          const creds = {
            cpf: decoder.decode(new Uint8Array(cpfBytes)),
            senha: decoder.decode(new Uint8Array(passBytes)),
          };
          sharedInMemoryStore.aprender3 = creds;
          return creds;
        }
      } catch {
        // Fallback
      }
    }
    return sharedInMemoryStore.aprender3 ? { ...sharedInMemoryStore.aprender3 } : null;
  }

  // --- TEAMS (Autenticação Manual / Sessão Conectada) ---
  async saveTeams(credentials: TeamsCredentials): Promise<void> {
    this.cleanLocalStorage();
    sharedInMemoryStore.teams = { ...credentials };

    const vault = await this.getStore();
    if (vault) {
      try {
        const encoder = new TextEncoder();
        await vault.store.insert('teams_connected', Array.from(encoder.encode(credentials.isConnected ? 'true' : 'false')));
        if (credentials.email) {
          await vault.store.insert('teams_email', Array.from(encoder.encode(credentials.email)));
        }
        await vault.saveVault();
      } catch (e) {
        console.warn('Erro ao persistir no Stronghold:', e);
      }
    }
  }

  async getTeams(): Promise<TeamsCredentials | null> {
    const vault = await this.getStore();
    if (vault) {
      try {
        const connBytes = await vault.store.get('teams_connected');
        if (connBytes) {
          const decoder = new TextDecoder();
          const isConn = decoder.decode(new Uint8Array(connBytes)) === 'true';
          let email: string | undefined = undefined;
          try {
            const emailBytes = await vault.store.get('teams_email');
            if (emailBytes) email = decoder.decode(new Uint8Array(emailBytes));
          } catch {}
          const creds = { isConnected: isConn, email };
          sharedInMemoryStore.teams = creds;
          return creds;
        }
      } catch {
        // Fallback
      }
    }
    return sharedInMemoryStore.teams ? { ...sharedInMemoryStore.teams } : null;
  }

  async getAll(): Promise<AllPlatformCredentials> {
    const [sigaa, aprender3, teams] = await Promise.all([
      this.getSigaa(),
      this.getAprender3(),
      this.getTeams(),
    ]);
    return {
      sigaa: sigaa ?? undefined,
      aprender3: aprender3 ?? undefined,
      teams: teams ?? undefined,
    };
  }

  async hasAnyCredentials(): Promise<boolean> {
    const all = await this.getAll();
    return Boolean(
      (all.sigaa && all.sigaa.matricula && all.sigaa.senha) ||
      (all.aprender3 && all.aprender3.cpf && all.aprender3.senha) ||
      (all.teams && all.teams.isConnected)
    );
  }

  async hasPlatformCredentials(platform: PlatformType): Promise<boolean> {
    switch (platform) {
      case 'sigaa': {
        const s = await this.getSigaa();
        return Boolean(s && s.matricula && s.senha);
      }
      case 'aprender3': {
        const a = await this.getAprender3();
        return Boolean(a && a.cpf && a.senha);
      }
      case 'teams': {
        const t = await this.getTeams();
        return Boolean(t && t.isConnected);
      }
    }
  }

  async clearPlatform(platform: PlatformType): Promise<void> {
    delete sharedInMemoryStore[platform];
    const vault = await this.getStore();
    if (vault) {
      try {
        switch (platform) {
          case 'sigaa':
            await vault.store.remove('sigaa_matricula');
            await vault.store.remove('sigaa_senha');
            break;
          case 'aprender3':
            await vault.store.remove('aprender3_cpf');
            await vault.store.remove('aprender3_senha');
            break;
          case 'teams':
            await vault.store.remove('teams_connected');
            await vault.store.remove('teams_email');
            break;
        }
        await vault.saveVault();
      } catch {}
    }
  }

  async clearAll(): Promise<void> {
    sharedInMemoryStore = {};
    const vault = await this.getStore();
    if (vault) {
      try {
        await vault.store.remove('sigaa_matricula');
        await vault.store.remove('sigaa_senha');
        await vault.store.remove('aprender3_cpf');
        await vault.store.remove('aprender3_senha');
        // Chaves legadas do MoodleMat (plataforma removida)
        await vault.store.remove('moodlemat_matricula');
        await vault.store.remove('moodlemat_senha');
        await vault.store.remove('teams_connected');
        await vault.store.remove('teams_email');
        await vault.saveVault();
      } catch {}
    }
  }

  // --- Métodos de compatibilidade ---
  async save(credentials: Credential): Promise<void> {
    await this.saveSigaa(credentials);
  }

  async get(): Promise<Credential | null> {
    return this.getSigaa();
  }

  async hasCredentials(): Promise<boolean> {
    return this.hasAnyCredentials();
  }

  async clear(): Promise<void> {
    await this.clearAll();
  }
}
