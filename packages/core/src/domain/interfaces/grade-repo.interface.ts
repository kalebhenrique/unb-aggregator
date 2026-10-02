import { Department, ScrapedClass, ScrapedDiscipline, ScheduleOption, SavedGrade } from '../entities/grade';

export interface IGradeRepository {
  getDepartments(): Promise<Department[]>;
  scrapeDepartmentClasses(deptId: string, year: string, period: string): Promise<ScrapedDiscipline[]>;
  solveSchedules(classes: ScrapedClass[], preferenceShift?: 'M' | 'T' | 'N'): Promise<ScheduleOption[]>;
  checkConflicts(classes: ScrapedClass[]): Promise<string[]>;
  saveGrade(grade: SavedGrade): Promise<void>;
  getSavedGrade(): Promise<SavedGrade | null>;
}
