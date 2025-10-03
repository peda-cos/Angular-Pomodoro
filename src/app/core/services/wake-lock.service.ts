import { inject, Injectable } from '@angular/core';
import { retryWithExponentialBackoff, tryExecuteAsync } from '../utils/error-utils';
import { ErrorCategory, GlobalErrorHandler } from './error-handler.service';

// Type definition for Wake Lock API
interface WakeLockSentinel {
  readonly released: boolean;
  readonly type: string;
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
  removeEventListener(type: 'release', listener: () => void): void;
}

interface WakeLockAPI {
  request(type: 'screen'): Promise<WakeLockSentinel>;
}

@Injectable({
  providedIn: 'root',
})
export class WakeLockService {
  private readonly errorHandler = inject(GlobalErrorHandler);
  private currentWakeLock: WakeLockSentinel | null = null;
  private isWakeLockSupported = 'wakeLock' in navigator;
  private wakeLockReleaseHandler: (() => void) | null = null;

  async request(): Promise<boolean> {
    if (!this.isWakeLockSupported) {
      console.warn('Wake Lock API not supported in this browser');
      return false;
    }

    if (this.currentWakeLock && !this.currentWakeLock.released) {
      console.log('Wake Lock already active');
      return true;
    }

    return await retryWithExponentialBackoff(
      async () => {
        const wakeLock = (navigator as Navigator & { wakeLock: WakeLockAPI }).wakeLock;

        if (!wakeLock) {
          throw new Error('Wake Lock API not available');
        }

        this.currentWakeLock = await wakeLock.request('screen');

        this.wakeLockReleaseHandler = () => {
          console.log('Wake Lock released by system');
          this.currentWakeLock = null;
        };

        this.currentWakeLock.addEventListener('release', this.wakeLockReleaseHandler);

        console.log('Wake Lock acquired successfully');
        return true;
      },
      {
        maxRetries: 2,
        initialDelayMs: 200,
        onRetry: (attemptNumber, error) => {
          console.log(`Retrying Wake Lock request (attempt ${attemptNumber})`, error.message);
        },
      }
    ).catch((error) => {
      this.errorHandler.logCategorizedError(
        ErrorCategory.WAKE_LOCK,
        'Failed to acquire Wake Lock after retries',
        error instanceof Error ? error : new Error(String(error)),
        {
          isSupported: this.isWakeLockSupported,
          visibilityState: document.visibilityState,
        }
      );
      return false;
    });
  }

  async release(): Promise<void> {
    if (!this.currentWakeLock) {
      return;
    }

    await tryExecuteAsync(
      async () => {
        if (this.wakeLockReleaseHandler && this.currentWakeLock) {
          this.currentWakeLock.removeEventListener('release', this.wakeLockReleaseHandler);
          this.wakeLockReleaseHandler = null;
        }

        if (this.currentWakeLock && !this.currentWakeLock.released) {
          await this.currentWakeLock.release();
          console.log('Wake Lock released successfully');
        }
      },
      undefined,
      (error) => {
        this.errorHandler.logCategorizedError(
          ErrorCategory.WAKE_LOCK,
          'Failed to release Wake Lock',
          error,
          { wasReleased: this.currentWakeLock?.released }
        );
      }
    );

    this.currentWakeLock = null;
  }

  isActive(): boolean {
    return this.currentWakeLock !== null && !this.currentWakeLock.released;
  }

  isSupported(): boolean {
    return this.isWakeLockSupported;
  }

  async reacquireWhenVisible(): Promise<void> {
    if (document.visibilityState === 'visible' && this.currentWakeLock?.released) {
      console.log('Document visible again, re-requesting Wake Lock');
      await this.request();
    }
  }
}
