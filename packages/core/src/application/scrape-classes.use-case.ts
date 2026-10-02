import { IGradeRepository } from '../domain/interfaces/grade-repo.interface';
import { ScrapedDiscipline } from '../domain/entities/grade';

export class ScrapeClassesUseCase {
  constructor(private gradeRepo: IGradeRepository) {}

  async execute(departmentId: string, year: string, period: string): Promise<ScrapedDiscipline[]> {
    if (!departmentId || !departmentId.trim()) {
      throw new Error('Código do departamento é obrigatório para coleta de turmas.');
    }
    return this.gradeRepo.scrapeDepartmentClasses(departmentId, year, period);
  }
}
