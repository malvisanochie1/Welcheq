export interface StoredPhoto {
  sizeBytes: number;
  contentType: string;
  createdAt: Date;
}

export interface PhotoStorage {
  readonly isConfigured: boolean;
  createUploadUrl(path: string): Promise<string>;
  describe(path: string): Promise<StoredPhoto | null>;
  createViewUrl(path: string, expiresInSeconds: number): Promise<string>;
}
