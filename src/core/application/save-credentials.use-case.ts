import type {
  Credential,
  SigaaCredentials,
  Aprender3Credentials,
  TeamsCredentials,
} from '../domain/entities/credential';
import {
  validateMatricula,
  validateCpf,
  validateSenha,
} from '../domain/entities/credential';
import type { ICredentialsRepository } from '../domain/interfaces/credentials-repo.interface';

export interface SaveResult {
  success: boolean;
  error?: string;
}

export class SaveCredentialsUseCase {
  constructor(private readonly credentialsRepo: ICredentialsRepository) {}

  async saveSigaa(credentials: SigaaCredentials): Promise<SaveResult> {
    if (!credentials.matricula || !validateMatricula(credentials.matricula)) {
      return { success: false, error: 'Matrícula do SIGAA inválida (informe 6 a 12 dígitos).' };
    }
    if (!credentials.senha || !validateSenha(credentials.senha)) {
      return { success: false, error: 'Senha do SIGAA deve ter ao menos 4 caracteres.' };
    }
    try {
      await this.credentialsRepo.saveSigaa({
        matricula: credentials.matricula.trim(),
        senha: credentials.senha,
      });
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar credenciais do SIGAA' };
    }
  }

  async saveAprender3(credentials: Aprender3Credentials): Promise<SaveResult> {
    const cleanCpf = credentials.cpf.replace(/\D/g, '');
    if (!validateCpf(cleanCpf)) {
      return { success: false, error: 'CPF do Aprender 3 inválido (informe os 11 dígitos).' };
    }
    if (!credentials.senha || !validateSenha(credentials.senha)) {
      return { success: false, error: 'Senha do Aprender 3 deve ter ao menos 4 caracteres.' };
    }
    try {
      await this.credentialsRepo.saveAprender3({
        cpf: cleanCpf,
        senha: credentials.senha,
      });
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar credenciais do Aprender 3' };
    }
  }

  async saveTeams(credentials: TeamsCredentials): Promise<SaveResult> {
    try {
      await this.credentialsRepo.saveTeams(credentials);
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar estado do Teams' };
    }
  }

  // Compatibilidade com fluxo inicial
  async execute(credentials: Credential): Promise<SaveResult> {
    return this.saveSigaa(credentials);
  }
}
