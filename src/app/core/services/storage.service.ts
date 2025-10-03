import { Injectable } from '@angular/core';

export interface StorageSchema {
  version: number;
}

const CURRENT_SCHEMA_VERSION = 1;

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly storageKeyPrefix = 'pomodoro_';
  private readonly CURRENT_SCHEMA_VERSION = 1;
  private readonly SCHEMA_VERSION_KEY = 'schemaVersion';
  private readonly CONCURRENT_MIGRATION_LOCK_KEY = 'migrationLock';
  private readonly MIGRATION_LOCK_TIMEOUT_MILLISECONDS = 5000;
  constructor() {
    this.checkSchemaVersionAndMigrate();
  }

  private checkSchemaVersionAndMigrate(): void {
    const currentStoredVersion = this.getSchemaVersion();
    if (currentStoredVersion < CURRENT_SCHEMA_VERSION) {
      if (this.acquireConcurrentMigrationLock()) {
        try {
          this.migrateSchema(currentStoredVersion, CURRENT_SCHEMA_VERSION);
          this.setSchemaVersion(CURRENT_SCHEMA_VERSION);
        } finally {
          this.releaseConcurrentMigrationLock();
        }
      } else {
        setTimeout(() => {
          const newVersion = this.getSchemaVersion();
          if (newVersion < CURRENT_SCHEMA_VERSION) {
            this.checkSchemaVersionAndMigrate();
          }
        }, 100);
      }
    }
  }

  private acquireConcurrentMigrationLock(): boolean {
    const existingLockTimestamp = localStorage.getItem(this.CONCURRENT_MIGRATION_LOCK_KEY);
    const currentTimestamp = Date.now();

    if (existingLockTimestamp) {
      const lockAge = currentTimestamp - parseInt(existingLockTimestamp, 10);

      if (lockAge < this.MIGRATION_LOCK_TIMEOUT_MILLISECONDS) {
        return false;
      }
    }

    localStorage.setItem(this.CONCURRENT_MIGRATION_LOCK_KEY, currentTimestamp.toString());
    return true;
  }

  private releaseConcurrentMigrationLock(): void {
    localStorage.removeItem(this.CONCURRENT_MIGRATION_LOCK_KEY);
  }

  private getSchemaVersion(): number {
    const versionString = localStorage.getItem(this.SCHEMA_VERSION_KEY);
    return versionString ? parseInt(versionString, 10) : 0;
  }

  private setSchemaVersion(version: number): void {
    localStorage.setItem(this.SCHEMA_VERSION_KEY, version.toString());
  }

  private migrateSchema(fromVersion: number, toVersion: number): void {
    console.log(`Migrating storage from version ${fromVersion} to ${toVersion}`);
  }

  get<T>(key: string): T | null {
    try {
      const storedItem = localStorage.getItem(this.storageKeyPrefix + key);
      return storedItem ? JSON.parse(storedItem) : null;
    } catch (error) {
      console.error(`Error reading from storage: ${key}`, error);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.storageKeyPrefix + key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to storage: ${key}`, error);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.storageKeyPrefix + key);
  }

  clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.storageKeyPrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  has(key: string): boolean {
    return localStorage.getItem(this.storageKeyPrefix + key) !== null;
  }
}
