import { IGradeRepository } from '../domain/interfaces/grade-repo.interface';
import { ScrapedClass, ScheduleOption } from '../domain/entities/grade';

export class SolveScheduleUseCase {
  constructor(private gradeRepo: IGradeRepository) {}

  async execute(
    candidateClasses: ScrapedClass[],
    preferenceShift?: 'M' | 'T' | 'N'
  ): Promise<ScheduleOption[]> {
    if (!candidateClasses || candidateClasses.length === 0) {
      return [];
    }
    return this.gradeRepo.solveSchedules(candidateClasses, preferenceShift);
  }

  async checkConflicts(classes: ScrapedClass[]): Promise<string[]> {
    return this.gradeRepo.checkConflicts(classes);
  }
}
