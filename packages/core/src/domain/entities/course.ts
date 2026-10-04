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

export interface CourseAssociation {
  aprenderCourseId: string;
  sigaaCourseId: string | null;
  isIgnored: boolean;
  updatedAt?: string;
}

export interface Discipline {
  id: string;
  code: string;
  name: string;
  semester: string;
  professor?: string;
  classroom?: string;
  schedule?: string;
  sigaaCourse?: Course;
  aprenderCourses: Course[];
  url?: string;
  unreadCount?: number;
  pendingAssignmentsCount?: number;
}
