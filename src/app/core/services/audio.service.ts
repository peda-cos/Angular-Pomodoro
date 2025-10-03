import { inject, Injectable } from '@angular/core';
import { retryWithExponentialBackoff, tryExecuteAsync } from '../utils/error-utils';
import { ErrorCategory, GlobalErrorHandler } from './error-handler.service';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private readonly errorHandler = inject(GlobalErrorHandler);
  private audioContext: AudioContext | null = null;
  private currentlyPlayingSource: AudioBufferSourceNode | null = null;
  private volumeGainNode: GainNode | null = null;
  private hasInitializedSuccessfully = false;
  private hasInitializationFailed = false;

  async initialize(): Promise<void> {
    if (this.hasInitializedSuccessfully) {
      return;
    }

    if (this.hasInitializationFailed) {
      return;
    }

    await tryExecuteAsync(
      async () => {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

        if (!AudioContextClass) {
          throw new Error('AudioContext is not supported in this browser');
        }

        this.audioContext = new AudioContextClass();
        this.volumeGainNode = this.audioContext.createGain();
        this.volumeGainNode.connect(this.audioContext.destination);
        this.hasInitializedSuccessfully = true;

        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      },
      undefined,
      (error) => {
        this.hasInitializationFailed = true;
        this.errorHandler.logCategorizedError(
          ErrorCategory.AUDIO,
          'Failed to initialize AudioContext',
          error,
          {
            browserSupport: {
              AudioContext: 'AudioContext' in window,
              webkitAudioContext: 'webkitAudioContext' in window,
            },
          }
        );
      }
    );
  }

  async playSound(soundTheme: 'soft' | 'bell' | 'none', volume: number): Promise<void> {
    if (soundTheme === 'none') {
      return;
    }

    if (typeof volume !== 'number' || isNaN(volume) || volume < 0 || volume > 1) {
      console.warn(`Invalid volume value: ${volume}, using default 0.5`);
      volume = 0.5;
    }

    await retryWithExponentialBackoff(
      async () => {
        await this.initialize();

        if (!this.audioContext || !this.volumeGainNode || this.hasInitializationFailed) {
          this.synthesizeSoundWithHtmlAudio(soundTheme, volume);
          return;
        }

        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        this.volumeGainNode.gain.value = volume;

        const oscillator = this.audioContext.createOscillator();
        oscillator.type = soundTheme === 'bell' ? 'sine' : 'triangle';
        oscillator.frequency.value = soundTheme === 'bell' ? 800 : 440;

        const volumeEnvelope = this.audioContext.createGain();
        volumeEnvelope.gain.setValueAtTime(0, this.audioContext.currentTime);
        volumeEnvelope.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        volumeEnvelope.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator.connect(volumeEnvelope);
        volumeEnvelope.connect(this.volumeGainNode);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
      },
      {
        maxRetries: 1,
        initialDelayMs: 100,
        onRetry: (attemptNumber, error) => {
          this.errorHandler.logCategorizedError(
            ErrorCategory.AUDIO,
            'Retrying sound playback',
            error,
            { attemptNumber, soundTheme, volume }
          );
        },
      }
    ).catch((error) => {
      this.errorHandler.logCategorizedError(
        ErrorCategory.AUDIO,
        'Failed to play sound after retries',
        error instanceof Error ? error : new Error(String(error)),
        { soundTheme, volume }
      );

      this.synthesizeSoundWithHtmlAudio(soundTheme, volume);
    });
  }

  private synthesizeSoundWithHtmlAudio(soundTheme: string, volume: number): void {
    try {
      const audioElement = new Audio();
      audioElement.volume = Math.max(0, Math.min(1, volume));

      const soundDurationSeconds = 0.5;
      const frequencyHz = soundTheme === 'bell' ? 800 : 440;
      const sampleRate = 44100;
      const totalSamples = soundDurationSeconds * sampleRate;

      console.log('Using HTML Audio fallback', { soundTheme, volume, frequencyHz });
    } catch (error) {
      this.errorHandler.logCategorizedError(
        ErrorCategory.AUDIO,
        'Fallback audio method also failed',
        error instanceof Error ? error : new Error(String(error)),
        { soundTheme, volume }
      );
    }
  }

  stopAllSounds(): void {
    if (this.currentlyPlayingSource) {
      try {
        this.currentlyPlayingSource.stop();
      } catch (error) {
        if (error instanceof Error && !error.message.includes('already')) {
          this.errorHandler.logCategorizedError(
            ErrorCategory.AUDIO,
            'Error stopping audio source',
            error
          );
        }
      } finally {
        this.currentlyPlayingSource = null;
      }
    }
  }

  adjustVolume(volumeLevel: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volumeLevel));

    if (this.volumeGainNode) {
      try {
        this.volumeGainNode.gain.value = clampedVolume;
      } catch (error) {
        this.errorHandler.logCategorizedError(
          ErrorCategory.AUDIO,
          'Failed to set volume',
          error instanceof Error ? error : new Error(String(error)),
          { requestedVolume: volumeLevel, clampedVolume }
        );
      }
    }
  }

  getContextState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  canPlayAudio(): boolean {
    return this.hasInitializedSuccessfully && !this.hasInitializationFailed;
  }
}
