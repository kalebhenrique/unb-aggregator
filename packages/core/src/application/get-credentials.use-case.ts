import type {
  Credential,
  SigaaCredentials,
  Aprender3Credentials,
  MoodleMatCredentials,
  TeamsCredentials,
  AllPlatformCredentials,
} from '../domain/entities/credential';
import type { PlatformType } from '../domain/entities/feed-item';
import type { ICredentialsRepository } from '../domain/interfaces/credentials-repo.interface';

export class GetCredentialsUseCase {
  constructor(private readonly credentialsRepo: ICredentialsRepository) {}

  async hasSavedCredentials(): Promise<boolean> {
    return this.credentialsRepo.hasAnyCredentials();
  }

  async hasPlatformCredentials(platform: PlatformType): Promise<boolean> {
    return this.credentialsRepo.hasPlatformCredentials(platform);
  }

  async getAllCredentials(): Promise<AllPlatformCredentials> {
    return this.credentialsRepo.getAll();
  }

  async getSigaa(): Promise<SigaaCredentials | null> {
    return this.credentialsRepo.getSigaa();
  }

  async getAprender3(): Promise<Aprender3Credentials | null> {
    return this.credentialsRepo.getAprender3();
  }

  async getMoodleMat(): Promise<MoodleMatCredentials | null> {
    return this.credentialsRepo.getMoodleMat();
  }

  async getTeams(): Promise<TeamsCredentials | null> {
    return this.credentialsRepo.getTeams();
  }

  async clearPlatform(platform: PlatformType): Promise<void> {
    return this.credentialsRepo.clearPlatform(platform);
  }

  async clearCredentials(): Promise<void> {
    return this.credentialsRepo.clearAll();
  }

  // Compatibilidade
  async getCredentials(): Promise<Credential | null> {
    return this.credentialsRepo.getSigaa();
  }
}
