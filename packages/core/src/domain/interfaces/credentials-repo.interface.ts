import type {
  Credential,
  SigaaCredentials,
  Aprender3Credentials,
  MoodleMatCredentials,
  TeamsCredentials,
  AllPlatformCredentials,
} from '../entities/credential';
import type { PlatformType } from '../entities/feed-item';

export interface ICredentialsRepository {
  // Operações por plataforma
  saveSigaa(credentials: SigaaCredentials): Promise<void>;
  getSigaa(): Promise<SigaaCredentials | null>;

  saveAprender3(credentials: Aprender3Credentials): Promise<void>;
  getAprender3(): Promise<Aprender3Credentials | null>;

  saveMoodleMat(credentials: MoodleMatCredentials): Promise<void>;
  getMoodleMat(): Promise<MoodleMatCredentials | null>;

  saveTeams(credentials: TeamsCredentials): Promise<void>;
  getTeams(): Promise<TeamsCredentials | null>;

  getAll(): Promise<AllPlatformCredentials>;
  hasAnyCredentials(): Promise<boolean>;
  hasPlatformCredentials(platform: PlatformType): Promise<boolean>;

  clearPlatform(platform: PlatformType): Promise<void>;
  clearAll(): Promise<void>;

  // Métodos de compatibilidade
  save(credentials: Credential): Promise<void>;
  get(): Promise<Credential | null>;
  hasCredentials(): Promise<boolean>;
  clear(): Promise<void>;
}
