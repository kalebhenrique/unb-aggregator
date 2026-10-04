import type { FeedItem, PlatformType } from '../domain/entities/feed-item';
import type { ISyncRepository, SyncResult } from '../domain/interfaces/sync-repo.interface';
import type { ICredentialsRepository } from '../domain/interfaces/credentials-repo.interface';

export class TauriSyncRepository implements ISyncRepository {
  constructor(private readonly credentialsRepo: ICredentialsRepository) {}

  async syncPlatform(platform: PlatformType): Promise<FeedItem[]> {
    const fullResult = await this.syncAll([platform]);
    return fullResult.items.filter((item) => item.platform === platform);
  }

  async syncAll(platforms?: PlatformType[]): Promise<SyncResult> {
    const selectedPlatforms: PlatformType[] = platforms && platforms.length > 0
      ? platforms
      : ['sigaa', 'aprender3', 'moodlemat', 'teams'];

    try {
      const { commands } = await import('@/core/infrastructure/bindings');
      const allCreds = await this.credentialsRepo.getAll();

      const response = await commands.syncPlatforms(
        selectedPlatforms,
        allCreds.sigaa ?? null,
        allCreds.aprender3 ?? null,
        allCreds.moodlemat ?? null,
        allCreds.teams
          ? {
              isConnected: allCreds.teams.isConnected ?? null,
              email: allCreds.teams.email ?? null,
            }
          : null
      );

      if (response.status === 'error') {
        throw new Error(response.error);
      }

      // Bindings tipam Option<T> como `T | null`; entidades de domínio usam
      // campos opcionais. A tradução acontece aqui, na fronteira do adapter.
      return {
        ...response.data,
        errors: response.data.errors ?? undefined,
      } as SyncResult;
    } catch (error) {
      console.error('Erro no comando nativo Tauri de sincronização:', error);
      return {
        items: [],
        courses: [],
        syncedAt: new Date().toISOString(),
        errors: { aprender3: error instanceof Error ? error.message : String(error) },
      };
    }
  }
}
