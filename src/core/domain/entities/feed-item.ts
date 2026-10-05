export type PlatformType = 'sigaa' | 'aprender3' | 'teams';

export type FeedItemType = 'post' | 'assignment';

export interface FeedItem {
  id: string;
  platform: PlatformType;
  title: string;
  content: string;
  courseName: string;
  courseCode?: string;
  author?: string;
  itemType: FeedItemType;
  createdAt: string; // ISO 8601 string
  dueDate?: string;  // ISO 8601 string (for assignments)
  isCompleted?: boolean;
  isArchived?: boolean;
  externalUrl?: string;
}
