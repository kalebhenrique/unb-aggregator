import type { FeedItem, PlatformType, FeedItemType } from '../domain/entities/feed-item';
import type { Course } from '../domain/entities/course';
import type { IFeedRepository, FeedFilterOptions } from '../domain/interfaces/feed-repo.interface';

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

interface SqliteFeedItemRow {
  id: string;
  platform: string;
  title: string;
  content: string;
  course_name: string;
  course_code: string;
  author: string | null;
  item_type: string;
  created_at: string;
  due_date: string | null;
  is_completed: number;
  external_url: string | null;
}

interface SqliteCourseRow {
  id: string;
  code: string;
  name: string;
  semester: string;
  platform: string;
  professor: string | null;
  classroom: string | null;
  schedule: string | null;
  unread_count: number;
  pending_assignments_count: number;
}

// Cache global de conexão com o banco SQLite
let cachedDbPromise: Promise<any> | null = null;

// Espelho em memória para ambientes sem Tauri (testes unitários e prévia web)
const inMemoryItems = new Map<string, FeedItem>();
const inMemoryCourses = new Map<string, Course>();

async function getDatabase(): Promise<any> {
  if (!isTauriEnvironment()) return null;

  if (!cachedDbPromise) {
    cachedDbPromise = (async () => {
      try {
        const { default: Database } = await import('@tauri-apps/plugin-sql');
        const db = await Database.load('sqlite:unb_aggregator.db');

        // Cria a tabela de disciplinas (courses)
        await db.execute(`
          CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            semester TEXT NOT NULL,
            platform TEXT NOT NULL,
            professor TEXT,
            classroom TEXT,
            schedule TEXT,
            unread_count INTEGER NOT NULL DEFAULT 0,
            pending_assignments_count INTEGER NOT NULL DEFAULT 0
          );
        `);

        // Cria a tabela de avisos e tarefas (feed_items)
        await db.execute(`
          CREATE TABLE IF NOT EXISTS feed_items (
            id TEXT PRIMARY KEY,
            platform TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            course_name TEXT NOT NULL,
            course_code TEXT NOT NULL,
            author TEXT,
            item_type TEXT NOT NULL,
            created_at TEXT NOT NULL,
            due_date TEXT,
            is_completed INTEGER NOT NULL DEFAULT 0,
            external_url TEXT
          );
        `);

        return db;
      } catch (err) {
        console.warn('SQLite nativo não inicializado, operando com espelho em memória:', err);
        return null;
      }
    })();
  }

  return cachedDbPromise;
}

export class SqliteFeedRepository implements IFeedRepository {
  async getItems(filters?: FeedFilterOptions): Promise<FeedItem[]> {
    const db = await getDatabase();

    if (db) {
      try {
        let query = 'SELECT * FROM feed_items WHERE 1=1';
        const params: any[] = [];

        if (filters) {
          if (filters.platform && filters.platform !== 'all') {
            params.push(filters.platform);
            query += ` AND platform = $${params.length}`;
          }

          if (filters.itemType && filters.itemType !== 'all') {
            params.push(filters.itemType);
            query += ` AND item_type = $${params.length}`;
          }

          if (filters.courseCode) {
            params.push(filters.courseCode);
            query += ` AND course_code = $${params.length}`;
          }

          if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
            params.push(`%${filters.searchQuery.trim().toLowerCase()}%`);
            query += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(content) LIKE $${params.length} OR LOWER(course_name) LIKE $${params.length})`;
          }
        }

        query += ' ORDER BY created_at DESC';

        const rows: SqliteFeedItemRow[] = await db.select(query, params);

        const items: FeedItem[] = rows.map((row) => ({
          id: row.id,
          platform: row.platform as PlatformType,
          title: row.title,
          content: row.content,
          courseName: row.course_name,
          courseCode: row.course_code,
          author: row.author ?? undefined,
          itemType: row.item_type as FeedItemType,
          createdAt: row.created_at,
          dueDate: row.due_date ?? undefined,
          isCompleted: Boolean(row.is_completed),
          externalUrl: row.external_url ?? undefined,
        }));

        // Atualiza espelho
        for (const item of items) {
          inMemoryItems.set(item.id, item);
        }

        return items;
      } catch (e) {
        console.warn('Erro ao consultar feed no SQLite, utilizando espelho:', e);
      }
    }

    // Fallback para espelho em memória
    let result = Array.from(inMemoryItems.values());

    if (filters) {
      if (filters.platform && filters.platform !== 'all') {
        result = result.filter((item) => item.platform === filters.platform);
      }
      if (filters.itemType && filters.itemType !== 'all') {
        result = result.filter((item) => item.itemType === filters.itemType);
      }
      if (filters.courseCode) {
        result = result.filter((item) => item.courseCode === filters.courseCode);
      }
      if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
        const q = filters.searchQuery.toLowerCase();
        result = result.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.content.toLowerCase().includes(q) ||
            item.courseName.toLowerCase().includes(q)
        );
      }
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async saveItems(newItems: FeedItem[]): Promise<void> {
    for (const item of newItems) {
      inMemoryItems.set(item.id, { ...item });
    }

    const db = await getDatabase();
    if (db) {
      try {
        for (const item of newItems) {
          await db.execute(
            `INSERT OR REPLACE INTO feed_items (
              id, platform, title, content, course_name, course_code, author, item_type, created_at, due_date, is_completed, external_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              item.id,
              item.platform,
              item.title,
              item.content,
              item.courseName,
              item.courseCode,
              item.author ?? null,
              item.itemType,
              item.createdAt,
              item.dueDate ?? null,
              item.isCompleted ? 1 : 0,
              item.externalUrl ?? null,
            ]
          );
        }
      } catch (e) {
        console.warn('Erro ao persistir items no SQLite:', e);
      }
    }
  }

  async markItemAsCompleted(id: string, isCompleted: boolean): Promise<void> {
    const existing = inMemoryItems.get(id);
    if (existing) {
      inMemoryItems.set(id, { ...existing, isCompleted });
    }

    const db = await getDatabase();
    if (db) {
      try {
        await db.execute('UPDATE feed_items SET is_completed = $1 WHERE id = $2', [
          isCompleted ? 1 : 0,
          id,
        ]);
      } catch (e) {
        console.warn('Erro ao atualizar status de conclusão no SQLite:', e);
      }
    }
  }

  async getCourses(): Promise<Course[]> {
    const db = await getDatabase();

    if (db) {
      try {
        const rows: SqliteCourseRow[] = await db.select(
          'SELECT * FROM courses ORDER BY name ASC'
        );

        const courses: Course[] = rows.map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          semester: row.semester,
          platform: row.platform as PlatformType,
          professor: row.professor ?? undefined,
          classroom: row.classroom ?? undefined,
          schedule: row.schedule ?? undefined,
          unreadCount: Number(row.unread_count || 0),
          pendingAssignmentsCount: Number(row.pending_assignments_count || 0),
        }));

        for (const c of courses) {
          inMemoryCourses.set(c.id, c);
        }

        return courses;
      } catch (e) {
        console.warn('Erro ao carregar turmas no SQLite, utilizando espelho:', e);
      }
    }

    return Array.from(inMemoryCourses.values());
  }

  async saveCourses(newCourses: Course[]): Promise<void> {
    for (const course of newCourses) {
      inMemoryCourses.set(course.id, { ...course });
    }

    const db = await getDatabase();
    if (db) {
      try {
        for (const course of newCourses) {
          await db.execute(
            `INSERT OR REPLACE INTO courses (
              id, code, name, semester, platform, professor, classroom, schedule, unread_count, pending_assignments_count
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              course.id,
              course.code,
              course.name,
              course.semester,
              course.platform,
              course.professor ?? null,
              course.classroom ?? null,
              course.schedule ?? null,
              course.unreadCount ?? 0,
              course.pendingAssignmentsCount ?? 0,
            ]
          );
        }
      } catch (e) {
        console.warn('Erro ao salvar turmas no SQLite:', e);
      }
    }
  }

  async clear(): Promise<void> {
    inMemoryItems.clear();
    inMemoryCourses.clear();

    const db = await getDatabase();
    if (db) {
      try {
        await db.execute('DELETE FROM feed_items');
        await db.execute('DELETE FROM courses');
      } catch (e) {
        console.warn('Erro ao limpar banco SQLite:', e);
      }
    }
  }
}
