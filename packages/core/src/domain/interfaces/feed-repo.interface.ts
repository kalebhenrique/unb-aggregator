import type { FeedItem, PlatformType, FeedItemType } from '../entities/feed-item';
import type { Course } from '../entities/course';

export interface FeedFilterOptions {
  platform?: PlatformType | 'all';
  itemType?: FeedItemType | 'all';
  searchQuery?: string;
  courseCode?: string;
}

export interface IFeedRepository {
  getItems(filters?: FeedFilterOptions): Promise<FeedItem[]>;
  saveItems(items: FeedItem[]): Promise<void>;
  markItemAsCompleted(id: string, isCompleted: boolean): Promise<void>;
  getCourses(): Promise<Course[]>;
  saveCourses(courses: Course[]): Promise<void>;
  clear(): Promise<void>;
}
