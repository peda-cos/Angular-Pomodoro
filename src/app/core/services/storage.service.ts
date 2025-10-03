import { inject, Injectable } from '@angular/core';
import { parseJsonWithFallback, stringifyJsonWithFallback, tryExecute } from '../utils/error-utils';
import { ErrorCategory, GlobalErrorHandler } from './error-handler.service';

export interface StorageSchema {
  version: number;
}

const CURRENT_SCHEMA_VERSION = 1;

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly errorHandler = inject(GlobalErrorHandler);
  private readonly storageKeyPrefix = 'pomodoro_';
  private readonly currentSchemaVersion = 1;
  private readonly schemaVersionStorageKey = 'schemaVersion';
  private readonly migrationLockStorageKey = 'migrationLock';
  private readonly migrationLockTimeoutMs = 5000;
  private isLocalStorageAvailable = true;

  constructor() {
    this.detectLocalStorageAvailability();
    this.migrateSchemaIfNeeded();
  }

  private detectLocalStorageAvailability(): void {
    this.isLocalStorageAvailable = tryExecute(
      () => {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
      },
      false,
      (error) => {
        this.errorHandler.logCategorizedError(
          ErrorCategory.STORAGE,
          'localStorage is not available',
          error,
          { browserInfo: navigator.userAgent }
        );
      }
    );
  }

  private migrateSchemaIfNeeded(): void {
    if (!this.isLocalStorageAvailable) {
      console.warn('Skipping schema migration - localStorage unavailable');
      return;
    }

    tryExecute(
      () => {
        const storedSchemaVersion = this.retrieveSchemaVersion();
        if (storedSchemaVersion < CURRENT_SCHEMA_VERSION) {
          if (this.acquireMigrationLock()) {
            try {
              this.performSchemaMigration(storedSchemaVersion, CURRENT_SCHEMA_VERSION);
              this.persistSchemaVersion(CURRENT_SCHEMA_VERSION);
            } catch (error) {
              this.errorHandler.logCategorizedError(
                ErrorCategory.STORAGE,
                'Schema migration failed',
                error instanceof Error ? error : new Error(String(error)),
                {
                  fromVersion: storedSchemaVersion,
                  toVersion: CURRENT_SCHEMA_VERSION,
                }
              );
            } finally {
              this.releaseMigrationLock();
            }
          } else {
            setTimeout(() => {
              const updatedVersion = this.retrieveSchemaVersion();
              if (updatedVersion < CURRENT_SCHEMA_VERSION) {
                this.migrateSchemaIfNeeded();
              }
            }, 100);
          }
        }
      },
      undefined,
      (error) => {
        this.errorHandler.logCategorizedError(
          ErrorCategory.STORAGE,
          'Failed to check schema version',
          error
        );
      }
    );
  }

  private acquireMigrationLock(): boolean {
    return tryExecute(
      () => {
        const existingLockTimestamp = localStorage.getItem(this.migrationLockStorageKey);
        const currentTimestampMs = Date.now();

        if (existingLockTimestamp) {
          const lockTimestampMs = parseInt(existingLockTimestamp, 10);

          if (isNaN(lockTimestampMs)) {
            localStorage.removeItem(this.migrationLockStorageKey);
          } else {
            const lockAgeMs = currentTimestampMs - lockTimestampMs;

            if (lockAgeMs < this.migrationLockTimeoutMs) {
              return false;
            }
          }
        }

        localStorage.setItem(this.migrationLockStorageKey, currentTimestampMs.toString());
        return true;
      },
      false,
      (error) => {
        this.errorHandler.logCategorizedError(
          ErrorCategory.STORAGE,
          'Failed to acquire migration lock',
          error
        );
      }
    );
  }

  private releaseMigrationLock(): void {
    tryExecute(
      () => {
        localStorage.removeItem(this.migrationLockStorageKey);
      },
      undefined,
      (error) => {
        this.errorHandler.logCategorizedError(
          ErrorCategory.STORAGE,
          'Failed to release migration lock',
          error
        );
      }
    );
  }

  private retrieveSchemaVersion(): number {
    return tryExecute(
      () => {
        const versionString = localStorage.getItem(this.schemaVersionStorageKey);
        if (!versionString) {
          return 0;
        }
        const parsedVersion = parseInt(versionString, 10);
        return isNaN(parsedVersion) ? 0 : parsedVersion;
      },
      0,
      (error) => {
        this.errorHandler.logCategorizedError(
          ErrorCategory.STORAGE,
          'Failed to get schema version',
          error
        );
      }
    );
  }

  private persistSchemaVersion(version: number): void {
    tryExecute(
      () => {
        localStorage.setItem(this.schemaVersionStorageKey, version.toString());
      },
      undefined,
      (error) => {
        this.errorHandler.logCategorizedError(
          ErrorCategory.STORAGE,
          'Failed to set schema version',
          error,
          { version }
        );
      }
    );
  }

  private performSchemaMigration(fromVersion: number, toVersion: number): void {
    console.log(`Migrating storage from version ${fromVersion} to ${toVersion}`);
  }

  get<T>(key: string): T | null {
    if (!this.isLocalStorageAvailable) {
      return null;
    }

    return tryExecute(
      () => {
        const serializedValue = localStorage.getItem(this.storageKeyPrefix + key);
        if (!serializedValue) {
          return null;
        }

        return parseJsonWithFallback<T | null>(serializedValue, null, (error) => {
          this.errorHandler.logCategorizedError(
            ErrorCategory.STORAGE,
            `Failed to parse stored value for key: ${key}`,
            error,
            { key, storedItem: serializedValue.substring(0, 100) }
          );
        });
      },
      null,
      (error) => {
        this.errorHandler.logCategorizedError(
          ErrorCategory.STORAGE,
          `Error reading from storage: ${key}`,
          error,
          { key }
        );
      }
    );
  }

  set<T>(key: string, value: T): boolean {
    if (!this.isLocalStorageAvailable) {
      return false;
    }

    return tryExecute(
      () => {
        const serializedValue = stringifyJsonWithFallback(value, undefined, (error) => {
          throw error;
        });

        try {
          localStorage.setItem(this.storageKeyPrefix + key, serializedValue);
          return true;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            this.errorHandler.logCategorizedError(
              ErrorCategory.STORAGE,
              'Storage quota exceeded',
              error instanceof Error ? error : new Error(String(error)),
              { key, valueSize: serializedValue.length }
            );

            this.freeUpStorageSpace();
          }
          throw error;
        }
      },
      false,
      (error) => {
        this.errorHandler.logCategorizedError(
          ErrorCategory.STORAGE,
          `Error writing to storage: ${key}`,
          error,
          { key }
        );
      }
    );
  }

  remove(key: string): void {
    if (!this.isLocalStorageAvailable) {
      return;
    }

    tryExecute(
      () => {
        localStorage.removeItem(this.storageKeyPrefix + key);
      },
      undefined,
      (error) => {
        this.errorHandler.logCategorizedError(
          ErrorCategory.STORAGE,
          `Error removing from storage: ${key}`,
          error,
          { key }
        );
      }
    );
  }

  private freeUpStorageSpace(): void {
    console.warn('Attempting storage cleanup due to quota exceeded...');

    tryExecute(
      () => {
        localStorage.removeItem(this.migrationLockStorageKey);
      },
      undefined,
      (error) => {
        this.errorHandler.logCategorizedError(
          ErrorCategory.STORAGE,
          'Failed during storage cleanup',
          error
        );
      }
    );
  }

  isAvailable(): boolean {
    return this.isLocalStorageAvailable;
  }

  clear(): void {
    const pomodoroKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey?.startsWith(this.storageKeyPrefix)) {
        pomodoroKeys.push(storageKey);
      }
    }
    pomodoroKeys.forEach((storageKey) => localStorage.removeItem(storageKey));
  }

  has(key: string): boolean {
    return localStorage.getItem(this.storageKeyPrefix + key) !== null;
  }
}
