import { IGradeRepository } from '../domain/interfaces/grade-repo.interface';
import { Department } from '../domain/entities/grade';

export class GetDepartmentsUseCase {
  constructor(private gradeRepo: IGradeRepository) {}

  async execute(): Promise<Department[]> {
    return this.gradeRepo.getDepartments();
  }
}
