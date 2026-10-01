import type { ICredentialsRepository } from './domain/interfaces/credentials-repo.interface';
import type { ISyncRepository } from './domain/interfaces/sync-repo.interface';
import type { IFeedRepository } from './domain/interfaces/feed-repo.interface';

import { SaveCredentialsUseCase } from './application/save-credentials.use-case';
import { GetCredentialsUseCase } from './application/get-credentials.use-case';
import { SyncPlatformsUseCase } from './application/sync-platforms.use-case';
import { GetFeedUseCase } from './application/get-feed.use-case';
import { GetCoursesUseCase } from './application/get-courses.use-case';

import { StrongholdCredentialsRepository } from './infrastructure/stronghold-credentials.repo';
import { TauriSyncRepository } from './infrastructure/tauri-sync.repo';
import { SqliteFeedRepository } from './infrastructure/sqlite-feed.repo';

export interface Repositories {
  credentialsRepo: ICredentialsRepository;
  syncRepo: ISyncRepository;
  feedRepo: IFeedRepository;
}

export interface UseCases {
  saveCredentials: SaveCredentialsUseCase;
  getCredentials: GetCredentialsUseCase;
  syncPlatforms: SyncPlatformsUseCase;
  getFeed: GetFeedUseCase;
  getCourses: GetCoursesUseCase;
}

export interface Container {
  repos: Repositories;
  useCases: UseCases;
}

export interface ContainerOverrides {
  repos?: Partial<Repositories>;
}

export function createContainer(overrides?: ContainerOverrides): Container {
  const credentialsRepo: ICredentialsRepository =
    overrides?.repos?.credentialsRepo ?? new StrongholdCredentialsRepository();

  const syncRepo: ISyncRepository =
    overrides?.repos?.syncRepo ?? new TauriSyncRepository(credentialsRepo);

  const feedRepo: IFeedRepository =
    overrides?.repos?.feedRepo ?? new SqliteFeedRepository();

  const repos: Repositories = {
    credentialsRepo,
    syncRepo,
    feedRepo,
  };

  const useCases: UseCases = {
    saveCredentials: new SaveCredentialsUseCase(credentialsRepo),
    getCredentials: new GetCredentialsUseCase(credentialsRepo),
    syncPlatforms: new SyncPlatformsUseCase(syncRepo, feedRepo),
    getFeed: new GetFeedUseCase(feedRepo),
    getCourses: new GetCoursesUseCase(feedRepo),
  };

  return {
    repos,
    useCases,
  };
}
