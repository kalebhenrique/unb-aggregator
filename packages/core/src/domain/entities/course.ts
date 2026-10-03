import type { PlatformType } from './feed-item';

export interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  platform: PlatformType;
  professor?: string;
  classroom?: string;
  schedule?: string;
  unreadCount?: number;
  pendingAssignmentsCount?: number;
  url?: string;
}
