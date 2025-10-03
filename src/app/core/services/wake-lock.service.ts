import { Injectable } from '@angular/core';

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
  private activeWakeLock: WakeLockSentinel | null = null;
  private isWakeLockSupported = 'wakeLock' in navigator;

  async request(): Promise<boolean> {
    if (!this.isWakeLockSupported) {
      console.warn('Wake Lock API not supported');
      return false;
    }

    try {
      const wakeLock = (navigator as Navigator & { wakeLock: WakeLockAPI }).wakeLock;
      this.activeWakeLock = await wakeLock.request('screen');

      this.activeWakeLock.addEventListener('release', () => {
        console.log('Wake Lock released');
      });

      console.log('Wake Lock acquired');
      return true;
    } catch (error) {
      console.error('Failed to acquire Wake Lock', error);
      return false;
    }
  }

  async release(): Promise<void> {
    if (this.activeWakeLock) {
      try {
        await this.activeWakeLock.release();
        this.activeWakeLock = null;
      } catch (error) {
        console.error('Failed to release Wake Lock', error);
      }
    }
  }

  isActive(): boolean {
    return this.activeWakeLock !== null;
  }
}
