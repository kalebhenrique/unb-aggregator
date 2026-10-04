import type { PlatformType } from '../domain/entities/feed-item';
import type { ISyncRepository, SyncResult } from '../domain/interfaces/sync-repo.interface';
import type { IFeedRepository } from '../domain/interfaces/feed-repo.interface';

export class SyncPlatformsUseCase {
  constructor(
    private readonly syncRepo: ISyncRepository,
    private readonly feedRepo: IFeedRepository
  ) {}

  async execute(platforms?: PlatformType[]): Promise<SyncResult> {
    const result = await this.syncRepo.syncAll(platforms);

    // Ordenação estrita por data (itens mais recentes primeiro)
    const sortedItems = [...result.items].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    await this.feedRepo.saveItems(sortedItems);

    if (result.courses.length > 0) {
      await this.feedRepo.saveCourses(result.courses);
    }

    return {
      items: sortedItems,
      courses: result.courses,
      syncedAt: result.syncedAt,
      errors: result.errors,
    };
  }
}
