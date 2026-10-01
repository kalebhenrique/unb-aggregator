import type { Course } from '../domain/entities/course';
import type { IFeedRepository } from '../domain/interfaces/feed-repo.interface';

export class GetCoursesUseCase {
  constructor(private readonly feedRepo: IFeedRepository) {}

  async execute(): Promise<Course[]> {
    const courses = await this.feedRepo.getCourses();
    return [...courses].sort((a, b) => a.name.localeCompare(b.name));
  }
}
