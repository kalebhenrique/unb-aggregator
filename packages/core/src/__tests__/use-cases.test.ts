import { describe, it, expect, beforeEach } from 'vitest';
import { createContainer } from '../container';

describe('Clean Architecture Use Cases - UnB Aggregator', () => {
  let container: ReturnType<typeof createContainer>;

  beforeEach(() => {
    container = createContainer();
  });

  describe('SaveCredentialsUseCase por Plataforma', () => {
    it('SIGAA: deve validar matrícula e salvar com sucesso', async () => {
      const invalid = await container.useCases.saveCredentials.saveSigaa({
        matricula: '123',
        senha: 'senha-segura',
      });
      expect(invalid.success).toBe(false);
      expect(invalid.error).toContain('Matrícula');

      const valid = await container.useCases.saveCredentials.saveSigaa({
        matricula: '202012345',
        senha: 'senha-segura',
      });
      expect(valid.success).toBe(true);

      const saved = await container.useCases.getCredentials.getSigaa();
      expect(saved?.matricula).toBe('202012345');
    });

    it('Aprender 3: deve validar CPF de 11 dígitos e salvar com sucesso', async () => {
      const invalidCpf = await container.useCases.saveCredentials.saveAprender3({
        cpf: '123.456',
        senha: 'senha-aprender',
      });
      expect(invalidCpf.success).toBe(false);
      expect(invalidCpf.error).toContain('CPF');

      const valid = await container.useCases.saveCredentials.saveAprender3({
        cpf: '012.345.678-90',
        senha: 'senha-aprender',
      });
      expect(valid.success).toBe(true);

      const saved = await container.useCases.getCredentials.getAprender3();
      expect(saved?.cpf).toBe('01234567890');
    });

    it('MoodleMat: deve validar matrícula e salvar com sucesso', async () => {
      const valid = await container.useCases.saveCredentials.saveMoodleMat({
        matricula: '202054321',
        senha: 'senha-matematica',
      });
      expect(valid.success).toBe(true);

      const saved = await container.useCases.getCredentials.getMoodleMat();
      expect(saved?.matricula).toBe('202054321');
    });

    it('Teams: deve registrar login manual interativo com sucesso', async () => {
      const valid = await container.useCases.saveCredentials.saveTeams({
        isConnected: true,
        email: 'aluno@aluno.unb.br',
      });
      expect(valid.success).toBe(true);

      const saved = await container.useCases.getCredentials.getTeams();
      expect(saved?.isConnected).toBe(true);
      expect(saved?.email).toBe('aluno@aluno.unb.br');
    });
  });

  describe('SyncPlatformsUseCase e GetFeedUseCase', () => {
    it('deve sincronizar plataformas e retornar itens ordenados cronologicamente', async () => {
      const syncResult = await container.useCases.syncPlatforms.execute(['sigaa', 'aprender3']);

      expect(syncResult.items.length).toBeGreaterThan(0);
      expect(syncResult.syncedAt).toBeDefined();

      const feed = await container.useCases.getFeed.execute();
      expect(feed.length).toBeGreaterThan(0);

      // Validação de ordenação cronológica
      for (let i = 0; i < feed.length - 1; i++) {
        const current = feed[i];
        const next = feed[i + 1];
        if (current.itemType === 'assignment' && next.itemType === 'assignment' && current.dueDate && next.dueDate) {
          expect(new Date(current.dueDate).getTime()).toBeLessThanOrEqual(new Date(next.dueDate).getTime());
        }
      }
    });

    it('deve filtrar itens por plataforma corretamente', async () => {
      await container.useCases.syncPlatforms.execute();
      const moodleItems = await container.useCases.getFeed.execute({ platform: 'moodlemat' });

      for (const item of moodleItems) {
        expect(item.platform).toBe('moodlemat');
      }
    });

    it('deve persistir e listar turmas via GetCoursesUseCase com o repositório padrão', async () => {
      await container.useCases.syncPlatforms.execute();
      const courses = await container.useCases.getCourses.execute();
      expect(courses.length).toBeGreaterThan(0);
      expect(courses[0].name).toBeDefined();
    });

    it('deve alternar status de conclusão de tarefa persistida', async () => {
      await container.useCases.syncPlatforms.execute();
      const items = await container.useCases.getFeed.execute();
      const task = items.find((i) => i.itemType === 'assignment');
      expect(task).toBeDefined();

      if (task) {
        const initialStatus = task.isCompleted;
        await container.useCases.getFeed.markAsCompleted(task.id, !initialStatus);
        const refreshed = await container.useCases.getFeed.execute();
        const updatedTask = refreshed.find((i) => i.id === task.id);
        expect(updatedTask?.isCompleted).toBe(!initialStatus);
      }
    });
  });
});
