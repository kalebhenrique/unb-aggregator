import type {
  Department,
  ScrapedClass,
  ScrapedDiscipline,
  ScheduleOption,
  ScheduleSlot,
  SavedGrade,
} from '../domain/entities/grade';
import type { IGradeRepository } from '../domain/interfaces/grade-repo.interface';

// Dados de demonstração para prévia no navegador (sem Tauri) e testes,
// com IDs oficiais do SIGAA UnB. O container só instancia este repository
// fora do runtime Tauri; o app empacotado nunca os usa.
const DEMO_DEPARTMENTS: Department[] = [
  { id: '508', name: 'DEPTO CIÊNCIAS DA COMPUTAÇÃO - CIC' },
  { id: '518', name: 'DEPARTAMENTO DE MATEMÁTICA - MAT' },
  { id: '514', name: 'DEPTO ESTATÍSTICA - EST' },
  { id: '443', name: 'DEPTO ENGENHARIA ELÉTRICA - ENE' },
  { id: '449', name: 'DEPARTAMENTO DE ENGENHARIA MECÂNICA - ENM' },
  { id: '440', name: 'DEPARTAMENTO DE ENGENHARIA CIVIL E AMBIENTAL - ENC' },
  { id: '524', name: 'INSTITUTO DE FÍSICA - IF' },
  { id: '610', name: 'INSTITUTO DE QUÍMICA - IQ' },
  { id: '327', name: 'DEPTO ADMINISTRAÇÃO - ADM' },
  { id: '333', name: 'DEPTO CIÊNCIAS CONTÁBEIS ATUARIAIS - CCA' },
  { id: '335', name: 'DEPTO ECONOMIA - ECO' },
  { id: '673', name: 'CAMPUS UNB GAMA - FGA' },
  { id: '672', name: 'CAMPUS UNB CEILÂNDIA - FCE' },
  { id: '675', name: 'CAMPUS UNB PLANALTINA - FUP' },
  { id: '401', name: 'FACULDADE DE DIREITO - FD' },
  { id: '379', name: 'FACULDADE DE MEDICINA - FM' },
];

function parseScheduleCodeTS(scheduleStr: string): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const regex = /(\d+)([MTN])(\d+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(scheduleStr)) !== null) {
    const daysPart = match[1];
    const shift = match[2] as 'M' | 'T' | 'N';
    const periodsPart = match[3];

    for (const dayCh of daysPart) {
      const day = parseInt(dayCh, 10);
      const dayName =
        day === 2
          ? 'Seg'
          : day === 3
          ? 'Ter'
          : day === 4
          ? 'Qua'
          : day === 5
          ? 'Qui'
          : day === 6
          ? 'Sex'
          : 'Sáb';

      for (const periodCh of periodsPart) {
        const period = parseInt(periodCh, 10);
        let timeRange = '';
        let globalSlotIndex = 0;

        if (shift === 'M') {
          globalSlotIndex = period - 1;
          timeRange =
            period === 1
              ? '08:00 - 08:55'
              : period === 2
              ? '08:55 - 09:50'
              : period === 3
              ? '10:00 - 10:55'
              : period === 4
              ? '10:55 - 11:50'
              : '12:00 - 12:55';
        } else if (shift === 'T') {
          globalSlotIndex = 5 + (period - 1);
          timeRange =
            period === 1
              ? '12:55 - 13:50'
              : period === 2
              ? '14:00 - 14:55'
              : period === 3
              ? '14:55 - 15:50'
              : period === 4
              ? '16:00 - 16:55'
              : period === 5
              ? '16:55 - 17:50'
              : '18:00 - 18:55';
        } else {
          globalSlotIndex = 11 + (period - 1);
          timeRange =
            period === 1
              ? '19:00 - 19:50'
              : period === 2
              ? '19:50 - 20:40'
              : period === 3
              ? '20:50 - 21:40'
              : '21:40 - 22:30';
        }

        const slot: ScheduleSlot = {
          day,
          dayName,
          shift,
          period,
          timeRange,
          globalSlotIndex,
        };

        if (
          !slots.some(
            (s) => s.day === slot.day && s.globalSlotIndex === slot.globalSlotIndex
          )
        ) {
          slots.push(slot);
        }
      }
    }
  }

  return slots;
}

const DEMO_DISCIPLINES: Record<string, ScrapedDiscipline[]> = {
  '508': [
    {
      code: 'CIC0004',
      name: 'ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES',
      departmentId: '508',
      classes: [
        {
          id: 'CIC0004-01',
          disciplineCode: 'CIC0004',
          disciplineName: 'ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES',
          classCode: '01',
          teachers: ['Prof. Carla Rocha'],
          classroom: 'PJC BT 110',
          scheduleCode: '24M34',
          scheduleSlots: parseScheduleCodeTS('24M34'),
          vacancies: 40,
          occupied: 38,
        },
        {
          id: 'CIC0004-02',
          disciplineCode: 'CIC0004',
          disciplineName: 'ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES',
          classCode: '02',
          teachers: ['Prof. Vinicius Ruela'],
          classroom: 'ICC SUL AT 55',
          scheduleCode: '35T23',
          scheduleSlots: parseScheduleCodeTS('35T23'),
          vacancies: 45,
          occupied: 42,
        },
        {
          id: 'CIC0004-03',
          disciplineCode: 'CIC0004',
          disciplineName: 'ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES',
          classCode: '03',
          teachers: ['Prof. Frank Ned'],
          classroom: 'PAT AT 04/10',
          scheduleCode: '24N12',
          scheduleSlots: parseScheduleCodeTS('24N12'),
          vacancies: 35,
          occupied: 30,
        },
      ],
    },
    {
      code: 'CIC0090',
      name: 'ESTRUTURAS DE DADOS',
      departmentId: '508',
      classes: [
        {
          id: 'CIC0090-01',
          disciplineCode: 'CIC0090',
          disciplineName: 'ESTRUTURAS DE DADOS',
          classCode: '01',
          teachers: ['Prof. Carlos Eduardo'],
          classroom: 'PJC BT 112',
          scheduleCode: '24T23',
          scheduleSlots: parseScheduleCodeTS('24T23'),
          vacancies: 40,
          occupied: 39,
        },
        {
          id: 'CIC0090-02',
          disciplineCode: 'CIC0090',
          disciplineName: 'ESTRUTURAS DE DADOS',
          classCode: '02',
          teachers: ['Prof. Tiago Alves'],
          classroom: 'ICC SUL BT 22',
          scheduleCode: '35M12',
          scheduleSlots: parseScheduleCodeTS('35M12'),
          vacancies: 40,
          occupied: 37,
        },
      ],
    },
    {
      code: 'CIC0097',
      name: 'BANCOS DE DADOS',
      departmentId: '508',
      classes: [
        {
          id: 'CIC0097-01',
          disciplineCode: 'CIC0097',
          disciplineName: 'BANCOS DE DADOS',
          classCode: '01',
          teachers: ['Prof. Maristela Holanda'],
          classroom: 'PJC BT 114',
          scheduleCode: '24M12',
          scheduleSlots: parseScheduleCodeTS('24M12'),
          vacancies: 35,
          occupied: 35,
        },
        {
          id: 'CIC0097-02',
          disciplineCode: 'CIC0097',
          disciplineName: 'BANCOS DE DADOS',
          classCode: '02',
          teachers: ['Prof. Sergio Lifschitz'],
          classroom: 'ICC SUL AT 40',
          scheduleCode: '35T45',
          scheduleSlots: parseScheduleCodeTS('35T45'),
          vacancies: 35,
          occupied: 30,
        },
      ],
    },
  ],
  '518': [
    {
      code: 'MAT0025',
      name: 'CÁLCULO 1',
      departmentId: '518',
      classes: [
        {
          id: 'MAT0025-01',
          disciplineCode: 'MAT0025',
          disciplineName: 'CÁLCULO 1',
          classCode: '01',
          teachers: ['Prof. Luciana Maria'],
          classroom: 'ICC CENTRO AT 10',
          scheduleCode: '246M12',
          scheduleSlots: parseScheduleCodeTS('246M12'),
          vacancies: 60,
          occupied: 58,
        },
        {
          id: 'MAT0025-02',
          disciplineCode: 'MAT0025',
          disciplineName: 'CÁLCULO 1',
          classCode: '02',
          teachers: ['Prof. Marcos Paulo'],
          classroom: 'PAT AT 01',
          scheduleCode: '246T23',
          scheduleSlots: parseScheduleCodeTS('246T23'),
          vacancies: 60,
          occupied: 55,
        },
        {
          id: 'MAT0025-03',
          disciplineCode: 'MAT0025',
          disciplineName: 'CÁLCULO 1',
          classCode: '03',
          teachers: ['Prof. Ricardo Ramos'],
          classroom: 'PJC BT 201',
          scheduleCode: '246N12',
          scheduleSlots: parseScheduleCodeTS('246N12'),
          vacancies: 50,
          occupied: 48,
        },
      ],
    },
    {
      code: 'MAT0031',
      name: 'ÁLGEBRA LINEAR',
      departmentId: '518',
      classes: [
        {
          id: 'MAT0031-01',
          disciplineCode: 'MAT0031',
          disciplineName: 'ÁLGEBRA LINEAR',
          classCode: '01',
          teachers: ['Prof. Yuri Dumaresq'],
          classroom: 'ICC CENTRO AT 12',
          scheduleCode: '35M34',
          scheduleSlots: parseScheduleCodeTS('35M34'),
          vacancies: 50,
          occupied: 47,
        },
        {
          id: 'MAT0031-02',
          disciplineCode: 'MAT0031',
          disciplineName: 'ÁLGEBRA LINEAR',
          classCode: '02',
          teachers: ['Prof. Daniela Amorim'],
          classroom: 'PAT AT 03',
          scheduleCode: '35T23',
          scheduleSlots: parseScheduleCodeTS('35T23'),
          vacancies: 50,
          occupied: 45,
        },
      ],
    },
  ],
};


let inMemorySavedGrade: SavedGrade | null = null;

export class InMemoryGradeRepository implements IGradeRepository {
  async getDepartments(): Promise<Department[]> {
    return DEMO_DEPARTMENTS;
  }

  async scrapeDepartmentClasses(
    deptId: string,
    _year: string,
    _period: string
  ): Promise<ScrapedDiscipline[]> {
    return (
      DEMO_DISCIPLINES[deptId] || [
        {
          code: 'EST0023',
          name: 'PROBABILIDADE E ESTATÍSTICA',
          departmentId: deptId,
          classes: [
            {
              id: 'EST0023-01',
              disciplineCode: 'EST0023',
              disciplineName: 'PROBABILIDADE E ESTATÍSTICA',
              classCode: '01',
              teachers: ['Prof. Maria Antonia'],
              classroom: 'ICC ALA SUL AT 30',
              scheduleCode: '24T45',
              scheduleSlots: parseScheduleCodeTS('24T45'),
              vacancies: 45,
              occupied: 40,
            },
          ],
        },
      ]
    );
  }

  async checkConflicts(classes: ScrapedClass[]): Promise<string[]> {
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
  }

  async getSavedGrade(): Promise<SavedGrade | null> {
    return inMemorySavedGrade;
  }

  async clearSavedGrade(): Promise<void> {
    inMemorySavedGrade = null;
  }
}
