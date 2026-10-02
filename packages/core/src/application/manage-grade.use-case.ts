import { IGradeRepository } from '../domain/interfaces/grade-repo.interface';
import { SavedGrade } from '../domain/entities/grade';

export class ManageGradeUseCase {
  constructor(private gradeRepo: IGradeRepository) {}

  async save(grade: SavedGrade): Promise<void> {
    if (!grade.selectedClasses) {
      throw new Error('Grade inválida para salvamento.');
    }
    await this.gradeRepo.saveGrade(grade);
  }

  async get(): Promise<SavedGrade | null> {
    return this.gradeRepo.getSavedGrade();
  }
}
