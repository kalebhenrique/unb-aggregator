import type { FeedItem, PlatformType, FeedItemType } from '../entities/feed-item';
import type { Course, CourseAssociation } from '../entities/course';

export interface FeedFilterOptions {
  platform?: PlatformType | 'all';
  itemType?: FeedItemType | 'all';
  searchQuery?: string;
  courseCode?: string;
  courseCodes?: string[];
  courseNames?: string[];
  includeArchived?: boolean;
  onlyArchived?: boolean;
}

export interface IFeedRepository {
  getItems(filters?: FeedFilterOptions): Promise<FeedItem[]>;
  saveItems(items: FeedItem[]): Promise<void>;
  markItemAsCompleted(id: string, isCompleted: boolean): Promise<void>;
  archiveItem(id: string, isArchived: boolean): Promise<void>;
  getCourses(): Promise<Course[]>;
  saveCourses(courses: Course[]): Promise<void>;
  getAssociations(): Promise<CourseAssociation[]>;
  saveAssociation(association: CourseAssociation): Promise<void>;
  clear(): Promise<void>;
}
