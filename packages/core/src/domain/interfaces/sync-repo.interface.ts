import type { FeedItem, PlatformType } from '../entities/feed-item';
import type { Course } from '../entities/course';

export interface SyncProgressUpdate {
  platform: PlatformType;
  status: 'pending' | 'in_progress' | 'success' | 'error';
  itemCount?: number;
  message?: string;
}

export interface SyncResult {
  items: FeedItem[];
  courses: Course[];
  syncedAt: string;
  errors?: Partial<Record<PlatformType, string>>;
}

export interface ISyncRepository {
  syncPlatform(platform: PlatformType): Promise<FeedItem[]>;
  syncAll(platforms?: PlatformType[]): Promise<SyncResult>;
}
