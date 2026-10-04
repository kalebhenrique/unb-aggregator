import type { Course, CourseAssociation, Discipline } from '../domain/entities/course';
import type { IFeedRepository } from '../domain/interfaces/feed-repo.interface';

export interface GetDisciplinesResult {
  disciplines: Discipline[];
  unmatchedAprenderCourses: Course[];
}

export function normalizeCourseText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export class GetCoursesUseCase {
  constructor(private readonly feedRepo: IFeedRepository) {}

  async execute(): Promise<Course[]> {
    const courses = await this.feedRepo.getCourses();
    return [...courses].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getDisciplines(): Promise<GetDisciplinesResult> {
    const allCourses = await this.feedRepo.getCourses();
    const associations = await this.feedRepo.getAssociations();

    const assocMap = new Map<string, CourseAssociation>();
    for (const assoc of associations) {
      assocMap.set(assoc.aprenderCourseId, assoc);
    }

    const sigaaCourses = allCourses.filter((c) => c.platform === 'sigaa');
    const aprenderCourses = allCourses.filter((c) => c.platform === 'aprender3');
    const otherCourses = allCourses.filter((c) => c.platform !== 'sigaa' && c.platform !== 'aprender3');

    // Se o usuário não tiver disciplinas do SIGAA, tratamos cada curso como sua própria disciplina
    if (sigaaCourses.length === 0) {
      const disciplines: Discipline[] = allCourses.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        semester: c.semester,
        professor: c.professor,
        classroom: c.classroom,
        schedule: c.schedule,
        sigaaCourse: c.platform === 'sigaa' ? c : undefined,
        aprenderCourses: c.platform === 'aprender3' ? [c] : [],
        url: c.url,
        unreadCount: c.unreadCount || 0,
        pendingAssignmentsCount: c.pendingAssignmentsCount || 0,
      }));

      return {
        disciplines,
        unmatchedAprenderCourses: [],
      };
    }

    // Ordena SIGAA por tamanho do nome normalizado decrescente para priorizar nomes mais específicos
    const sortedSigaa = [...sigaaCourses].sort(
      (a, b) => normalizeCourseText(b.name).length - normalizeCourseText(a.name).length
    );

    // Mapeamento de SIGAA ID -> Array de Aprender3 Courses
    const sigaaToAprender = new Map<string, Course[]>();
    for (const sc of sigaaCourses) {
      sigaaToAprender.set(sc.id, []);
    }

    const unmatchedAprenderCourses: Course[] = [];

    for (const ac of aprenderCourses) {
      const existingAssoc = assocMap.get(ac.id);

      // Se o usuário marcou para ignorar
      if (existingAssoc?.isIgnored) {
        continue;
      }

      // Se há associação manual persistida no SQLite
      if (existingAssoc?.sigaaCourseId && sigaaToAprender.has(existingAssoc.sigaaCourseId)) {
        sigaaToAprender.get(existingAssoc.sigaaCourseId)!.push(ac);
        continue;
      }

      // Tentativa de matching automático
      const normAprenderName = normalizeCourseText(ac.name);
      const normAprenderCode = normalizeCourseText(ac.code);

      let matchedSigaa: Course | undefined;

      // 1. Tenta casar por código se não for genérico
      if (normAprenderCode.length >= 4 && normAprenderCode !== 'APRENDER3' && normAprenderCode !== 'A3') {
        matchedSigaa = sortedSigaa.find(
          (s) => normalizeCourseText(s.code) === normAprenderCode
        );
      }

      // 2. Se não casou por código, tenta substring de nome mais específico
      if (!matchedSigaa) {
        matchedSigaa = sortedSigaa.find((s) => {
          const normSigaaName = normalizeCourseText(s.name);
          return normSigaaName.length >= 4 && normAprenderName.includes(normSigaaName);
        });
      }

      if (matchedSigaa) {
        sigaaToAprender.get(matchedSigaa.id)!.push(ac);
      } else {
        unmatchedAprenderCourses.push(ac);
      }
    }

    const disciplines: Discipline[] = sigaaCourses.map((sc) => {
      const linkedAprender = sigaaToAprender.get(sc.id) || [];
      const totalUnread = (sc.unreadCount || 0) + linkedAprender.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      const totalPending = (sc.pendingAssignmentsCount || 0) + linkedAprender.reduce((acc, c) => acc + (c.pendingAssignmentsCount || 0), 0);

      return {
        id: sc.id,
        code: sc.code,
        name: sc.name,
        semester: sc.semester,
        professor: sc.professor,
        classroom: sc.classroom,
        schedule: sc.schedule,
        sigaaCourse: sc,
        aprenderCourses: linkedAprender,
        url: sc.url,
        unreadCount: totalUnread,
        pendingAssignmentsCount: totalPending,
      };
    });

    // Se houver outras plataformas (como MoodleMat ou Teams), inclui no rol
    for (const oc of otherCourses) {
      disciplines.push({
        id: oc.id,
        code: oc.code,
        name: oc.name,
        semester: oc.semester,
        professor: oc.professor,
        classroom: oc.classroom,
        schedule: oc.schedule,
        aprenderCourses: [],
        url: oc.url,
        unreadCount: oc.unreadCount || 0,
        pendingAssignmentsCount: oc.pendingAssignmentsCount || 0,
      });
    }

    disciplines.sort((a, b) => a.name.localeCompare(b.name));

    return {
      disciplines,
      unmatchedAprenderCourses,
    };
  }

  async associateCourse(aprenderCourseId: string, sigaaCourseId: string | null, isIgnored: boolean = false): Promise<void> {
    await this.feedRepo.saveAssociation({
      aprenderCourseId,
      sigaaCourseId,
      isIgnored,
      updatedAt: new Date().toISOString(),
    });
  }
}

