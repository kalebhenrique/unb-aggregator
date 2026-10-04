import type {
  Department,
  ScrapedClass,
  ScrapedDiscipline,
  ScheduleOption,
  ScheduleSlot,
  SavedGrade,
} from '../domain/entities/grade';
import type Database from '@tauri-apps/plugin-sql';
import type {
  ScrapedClass as RawScrapedClass,
  ScheduleOption as RawScheduleOption,
  ScheduleSlot as RawScheduleSlot,
} from './bindings';
import type { IGradeRepository } from '../domain/interfaces/grade-repo.interface';

let inMemorySavedGrade: SavedGrade | null = null;

export class TauriGradeRepository implements IGradeRepository {
  private async getDb(): Promise<Database | null> {
    try {
      const { default: Database } = await import('@tauri-apps/plugin-sql');
      const db = await Database.load('sqlite:unb_aggregator.db');
      await db.execute(`
        CREATE TABLE IF NOT EXISTS saved_grades (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          semester TEXT NOT NULL,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      return db;
    } catch (e) {
      console.warn('[TauriGradeRepository] Falha ao carregar banco SQLite:', e);
      return null;
    }
  }

  async getDepartments(): Promise<Department[]> {
    try {
      const { commands } = await import('@/core/infrastructure/bindings');
      const response = await commands.getSigaaDepartments();
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      if (response.data && response.data.length > 0) {
        return response.data as Department[];
      }
    } catch (e) {
      console.error('[TauriGradeRepository] getDepartments: falha ao invocar get_sigaa_departments:', e);
    }
    return [];
  }

  async scrapeDepartmentClasses(
    deptId: string,
    year: string,
    period: string
  ): Promise<ScrapedDiscipline[]> {
    try {
      const { commands } = await import('@/core/infrastructure/bindings');
      const response = await commands.scrapeSigaaClasses(deptId, year, period);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      const rawDisciplines = response.data;

      if (rawDisciplines && rawDisciplines.length > 0) {
        // Mapeia snake_case para camelCase
        return rawDisciplines.map((d) => ({
          code: d.code,
          name: d.name,
          departmentId: d.department_id || deptId,
          classes: (d.classes || []).map((c: RawScrapedClass) => ({
            id: c.id,
            disciplineCode: c.discipline_code,
            disciplineName: c.discipline_name,
            classCode: c.class_code,
            teachers: c.teachers || [],
            classroom: c.classroom || 'A definir',
            scheduleCode: c.schedule_code,
            scheduleDescription: c.schedule_description ?? undefined,
            dateRange: c.date_range ?? undefined,
            scheduleSlots: (c.schedule_slots || []).map((s: RawScheduleSlot) => ({
              day: s.day,
              dayName: s.day_name,
              shift: s.shift as ScheduleSlot['shift'],
              period: s.period,
              timeRange: s.time_range,
              globalSlotIndex: s.global_slot_index,
            })),
            vacancies: c.vacancies ?? undefined,
            occupied: c.occupied ?? undefined,
          })),
        }));
      }
      console.warn(`[TauriGradeRepository] scrapeDepartmentClasses: lista vazia para depto ${deptId}`);
    } catch (e) {
      console.error('[TauriGradeRepository] scrapeDepartmentClasses: falha ao raspar turmas via Tauri:', e);
    }
    return [];
  }

  async checkConflicts(classes: ScrapedClass[]): Promise<string[]> {
    try {
      const { commands } = await import('@/core/infrastructure/bindings');
      const response = await commands.checkScheduleConflicts(
        classes.map((c) => ({
          id: c.id,
          discipline_code: c.disciplineCode,
          discipline_name: c.disciplineName,
          class_code: c.classCode,
          teachers: c.teachers,
          classroom: c.classroom,
          schedule_code: c.scheduleCode,
          schedule_description: c.scheduleDescription ?? null,
          date_range: c.dateRange ?? null,
          schedule_slots: c.scheduleSlots.map((s) => ({
            day: s.day,
            day_name: s.dayName,
            shift: s.shift,
            period: s.period,
            time_range: s.timeRange,
            global_slot_index: s.globalSlotIndex,
          })),
          vacancies: c.vacancies ?? null,
          occupied: c.occupied ?? null,
        }))
      );
      if (response.status === 'ok') return response.data;
    } catch (e) {
      console.warn('[TauriGradeRepository] Falha ao checar conflitos via Tauri, usando solver local:', e);
    }

    // Fallback TS
    const conflicts: string[] = [];
    const slotMap = new Map<string, ScrapedClass>();

    for (const c of classes) {
      for (const slot of c.scheduleSlots) {
        const key = `${slot.day}-${slot.globalSlotIndex}`;
        const existing = slotMap.get(key);
        if (existing) {
          if (existing.disciplineCode !== c.disciplineCode) {
            const desc = `Conflito na ${slot.dayName} (${slot.timeRange}) entre ${existing.disciplineCode} e ${c.disciplineCode}`;
            if (!conflicts.includes(desc)) conflicts.push(desc);
          }
        } else {
          slotMap.set(key, c);
        }
      }
    }

    return conflicts;
  }

  async solveSchedules(
    classes: ScrapedClass[],
    preferenceShift?: 'M' | 'T' | 'N'
  ): Promise<ScheduleOption[]> {
    try {
      const { commands } = await import('@/core/infrastructure/bindings');
      const response = await commands.solveSchedules(
        classes.map((c) => ({
          id: c.id,
          discipline_code: c.disciplineCode,
          discipline_name: c.disciplineName,
          class_code: c.classCode,
          teachers: c.teachers,
          classroom: c.classroom,
          schedule_code: c.scheduleCode,
          schedule_description: c.scheduleDescription ?? null,
          date_range: c.dateRange ?? null,
          schedule_slots: c.scheduleSlots.map((s) => ({
            day: s.day,
            day_name: s.dayName,
            shift: s.shift,
            period: s.period,
            time_range: s.timeRange,
            global_slot_index: s.globalSlotIndex,
          })),
          vacancies: c.vacancies ?? null,
          occupied: c.occupied ?? null,
        })),
        preferenceShift ?? null
      );

      if (response.status === 'error') {
        throw new Error(response.error);
      }
      const rawOptions = response.data;

      if (rawOptions && rawOptions.length > 0) {
        return rawOptions.map((opt: RawScheduleOption) => ({
          id: opt.id,
          hasConflict: opt.has_conflict,
          conflicts: opt.conflicts || [],
          score: opt.score || 0,
          classes: (opt.classes || []).map((c: RawScrapedClass) => ({
            id: c.id,
            disciplineCode: c.discipline_code,
            disciplineName: c.discipline_name,
            classCode: c.class_code,
            teachers: c.teachers || [],
            classroom: c.classroom || 'A definir',
            scheduleCode: c.schedule_code,
            scheduleDescription: c.schedule_description ?? undefined,
            dateRange: c.date_range ?? undefined,
            scheduleSlots: (c.schedule_slots || []).map((s: RawScheduleSlot) => ({
              day: s.day,
              dayName: s.day_name,
              shift: s.shift as ScheduleSlot['shift'],
              period: s.period,
              timeRange: s.time_range,
              globalSlotIndex: s.global_slot_index,
            })),
            vacancies: c.vacancies ?? undefined,
            occupied: c.occupied ?? undefined,
          })),
        }));
      }
    } catch (e) {
      console.warn('[TauriGradeRepository] Falha ao resolver grade via Tauri, usando solver local:', e);
    }

    // Fallback TS solver
    const byDiscipline = new Map<string, ScrapedClass[]>();
    for (const c of classes) {
      const list = byDiscipline.get(c.disciplineCode) || [];
      list.push(c);
      byDiscipline.set(c.disciplineCode, list);
    }

    const groups = Array.from(byDiscipline.values());
    if (groups.length === 0) return [];

    let combinations: ScrapedClass[][] = [[]];
    for (const group of groups) {
      const next: ScrapedClass[][] = [];
      for (const curr of combinations) {
        for (const opt of group) {
          next.push([...curr, opt]);
        }
      }
      combinations = next.slice(0, 100);
    }

    const validOptions: ScheduleOption[] = [];
    for (let i = 0; i < combinations.length; i++) {
      const comb = combinations[i];
      const conflicts = await this.checkConflicts(comb);
      if (conflicts.length === 0) {
        let score = 100;
        if (preferenceShift) {
          for (const c of comb) {
            for (const s of c.scheduleSlots) {
              score += s.shift === preferenceShift ? 10 : -5;
            }
          }
        }
        validOptions.push({
          id: `opt-${i + 1}`,
          classes: comb,
          hasConflict: false,
          conflicts: [],
          score,
        });
      }
    }

    validOptions.sort((a, b) => b.score - a.score);
    return validOptions;
  }

  async saveGrade(grade: SavedGrade): Promise<void> {
    inMemorySavedGrade = grade;
    const db = await this.getDb();
    if (db) {
      await db.execute(
        `INSERT OR REPLACE INTO saved_grades (id, name, semester, data, updated_at) VALUES ($1, $2, $3, $4, $5)`,
        [
          grade.id,
          grade.name,
          grade.semester,
          JSON.stringify(grade.selectedClasses),
          grade.updatedAt,
        ]
      );
    }
  }

  async getSavedGrade(): Promise<SavedGrade | null> {
    const db = await this.getDb();
    if (db) {
      try {
        const rows = await db.select<{
          id: string;
          name: string;
          semester: string;
          data: string;
          updated_at: string;
        }[]>(
          `SELECT id, name, semester, data, updated_at FROM saved_grades ORDER BY updated_at DESC LIMIT 1`
        );
        if (rows && rows.length > 0) {
          const row = rows[0];
          return {
            id: row.id,
            name: row.name,
            semester: row.semester,
            selectedClasses: JSON.parse(row.data),
            updatedAt: row.updated_at,
          };
        }
      } catch (e) {
        console.warn('[TauriGradeRepository] Falha ao ler grade do SQLite:', e);
      }
    }
    return inMemorySavedGrade;
  }

  async clearSavedGrade(): Promise<void> {
    inMemorySavedGrade = null;
    const db = await this.getDb();
    if (db) {
      try {
        await db.execute('DELETE FROM saved_grades');
      } catch (e) {
        console.warn('[TauriGradeRepository] Falha ao limpar saved_grades:', e);
      }
    }
  }
}
