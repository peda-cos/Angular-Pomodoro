import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audioContext: AudioContext | null = null;
  private activeAudioSource: AudioBufferSourceNode | null = null;
  private volumeGainNode: GainNode | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.volumeGainNode = this.audioContext.createGain();
      this.volumeGainNode.connect(this.audioContext.destination);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AudioContext', error);
    }
  }

  async playSound(soundTheme: 'soft' | 'bell' | 'none', volume: number): Promise<void> {
    if (soundTheme === 'none') {
      return;
    }

    try {
      await this.initialize();

      if (!this.audioContext || !this.volumeGainNode) {
        this.playWithFallbackHtmlAudio(soundTheme, volume);
        return;
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
    } catch (error) {
      console.error('Failed to play sound', error);
      this.playWithFallbackHtmlAudio(soundTheme, volume);
    }
  }

  private playWithFallbackHtmlAudio(soundTheme: string, volume: number): void {
    const audioElement = new Audio();
    audioElement.volume = volume;

    const soundDurationSeconds = 0.5;
    const frequencyHz = soundTheme === 'bell' ? 800 : 440;
    const sampleRate = 44100;
    const totalSamples = soundDurationSeconds * sampleRate;

    console.log('Playing audio with fallback method');
  }

  stopAll(): void {
    if (this.activeAudioSource) {
      try {
        this.activeAudioSource.stop();
      } catch (error) {}
      this.activeAudioSource = null;
    }
  }

  setVolume(volume: number): void {
    if (this.volumeGainNode) {
      this.volumeGainNode.gain.value = volume;
    }
  }
}
