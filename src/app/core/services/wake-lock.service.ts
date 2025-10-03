import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WakeLockService {
  private activeWakeLock: any = null;
  private isWakeLockSupported = 'wakeLock' in navigator;

  async request(): Promise<boolean> {
    if (!this.isWakeLockSupported) {
      console.warn('Wake Lock API not supported');
      return false;
    }

    try {
      this.activeWakeLock = await (navigator as any).wakeLock.request('screen');

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
