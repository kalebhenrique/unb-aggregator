import type { FeedItem, PlatformType } from '../domain/entities/feed-item';
import type { Course } from '../domain/entities/course';
import type { ISyncRepository, SyncResult } from '../domain/interfaces/sync-repo.interface';

// Dados de demonstração para prévia no navegador (sem Tauri) e testes.
// Nunca são usados no app empacotado: o container só instancia este
// repository fora do runtime Tauri.

const DEMO_COURSES: Course[] = [
  {
    id: 'course-1',
    code: 'MAT0025',
    name: 'Cálculo 1',
    semester: '2026.1',
    platform: 'moodlemat',
    professor: 'Prof. Marcelo Silva',
    classroom: 'PAT AT 02/10',
    schedule: 'Seg/Qua 10:00 - 11:50',
    unreadCount: 2,
    pendingAssignmentsCount: 1,
  },
  {
    id: 'course-2',
    code: 'CIC0004',
    name: 'Algoritmos e Programação de Computadores',
    semester: '2026.1',
    platform: 'aprender3',
    professor: 'Profa. Renata Garcia',
    classroom: 'Lab CIC 03',
    schedule: 'Ter/Qui 08:00 - 09:50',
    unreadCount: 1,
    pendingAssignmentsCount: 2,
  },
  {
    id: 'course-3',
    code: 'CIC0090',
    name: 'Estruturas de Dados',
    semester: '2026.1',
    platform: 'sigaa',
    professor: 'Prof. Carlos Eduardo',
    classroom: 'PJC BT 110',
    schedule: 'Seg/Qua 14:00 - 15:50',
    unreadCount: 3,
    pendingAssignmentsCount: 0,
  },
  {
    id: 'course-4',
    code: 'FGA0138',
    name: 'Métodos de Desenvolvimento de Software',
    semester: '2026.1',
    platform: 'teams',
    professor: 'Prof. Fernando Mendes',
    classroom: 'Teams Online / FGA UED',
    schedule: 'Ter/Qui 16:00 - 17:50',
    unreadCount: 4,
    pendingAssignmentsCount: 1,
  },
];

const DEMO_FEED_ITEMS: FeedItem[] = [
  {
    id: 'feed-1',
    platform: 'moodlemat',
    title: 'Lista 3 de Exercícios: Derivadas e Regra da Cadeia',
    content: 'A Lista 3 já está disponível para envio. Certifiquem-se de submeter a resolução em PDF até o horário limite indicado.',
    courseName: 'Cálculo 1',
    courseCode: 'MAT0025',
    author: 'Prof. Marcelo Silva',
    itemType: 'assignment',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),  // em 2 dias
    isCompleted: false,
    externalUrl: 'https://moodle.mat.unb.br/mod/assign/view.php?id=1042',
  },
  {
    id: 'feed-2',
    platform: 'sigaa',
    title: 'Divulgação das Notas da Prova 1 e Revisão de Menções',
    content: 'As notas da primeira avaliação individual foram cadastradas no sistema. A sessão de revisão presencial ocorrerá na próxima quarta-feira.',
    courseName: 'Estruturas de Dados',
    courseCode: 'CIC0090',
    author: 'Prof. Carlos Eduardo',
    itemType: 'post',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 horas atrás
    externalUrl: 'https://sigaa.unb.br/sigaa/portais/discente/discente.jsf',
  },
  {
    id: 'feed-3',
    platform: 'aprender3',
    title: 'Projeto Prático 1: Implementação de Autômato Finito',
    content: 'Submissão do código-fonte e relatório técnico referente ao Trabalho Prático da Unidade 1. Entrega individual através do VPL.',
    courseName: 'Algoritmos e Programação de Computadores',
    courseCode: 'CIC0004',
    author: 'Profa. Renata Garcia',
    itemType: 'assignment',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 horas atrás
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),   // em 1 dia
    isCompleted: false,
    externalUrl: 'https://aprender3.unb.br/mod/vpl/view.php?id=38192',
  },
  {
    id: 'feed-4',
    platform: 'teams',
    title: 'Sprint 2: Reunião de Alinhamento e Arquitetura',
    content: 'Disponibilizado o link da gravação da aula síncrona sobre Clean Architecture e divisão de microsserviços. O material de apoio está na aba Arquivos do canal Geral.',
    courseName: 'Métodos de Desenvolvimento de Software',
    courseCode: 'FGA0138',
    author: 'Prof. Fernando Mendes',
    itemType: 'post',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), // 20 horas atrás
    externalUrl: 'https://teams.microsoft.com',
  },
  {
    id: 'feed-5',
    platform: 'aprender3',
    title: 'Material Teórico: Complexidade de Algoritmos e Notação Big-O',
    content: 'Slides e exercícios resolvidos referentes à aula de análise assintótica foram adicionados ao tópico da Semana 4.',
    courseName: 'Algoritmos e Programação de Computadores',
    courseCode: 'CIC0004',
    author: 'Profa. Renata Garcia',
    itemType: 'post',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 36 horas atrás
    externalUrl: 'https://aprender3.unb.br/course/view.php?id=1294',
  },
];

export class InMemorySyncRepository implements ISyncRepository {
  async syncPlatform(platform: PlatformType): Promise<FeedItem[]> {
    const fullResult = await this.syncAll([platform]);
    return fullResult.items.filter((item) => item.platform === platform);
  }

  async syncAll(platforms?: PlatformType[]): Promise<SyncResult> {
    const selectedPlatforms: PlatformType[] = platforms && platforms.length > 0
      ? platforms
      : ['sigaa', 'aprender3', 'moodlemat', 'teams'];

    // Simula latência de rede para a prévia no navegador parecer real.
    await new Promise((resolve) => setTimeout(resolve, 800));

    const filteredItems = DEMO_FEED_ITEMS.filter((item) =>
      selectedPlatforms.includes(item.platform)
    );

    const filteredCourses = DEMO_COURSES.filter((course) =>
      selectedPlatforms.includes(course.platform)
    );

    return {
      items: filteredItems,
      courses: filteredCourses,
      syncedAt: new Date().toISOString(),
    };
  }
}
