import { TestBed } from '@angular/core/testing';
import { DEFAULT_SETTINGS } from '../models/pomodoro-settings.model';
import { HistoryService } from './history.service';
import { StorageService } from './storage.service';
import { TimerService } from './timer.service';

describe('TimerService', () => {
  let service: TimerService;
  let storageService: StorageService;
  let historyService: HistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimerService);
    storageService = TestBed.inject(StorageService);
    historyService = TestBed.inject(HistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with idle state', () => {
    expect(service.status()).toBe('idle');
  });

  it('should start timer', () => {
    service.initialize(DEFAULT_SETTINGS);
    service.start(DEFAULT_SETTINGS);
    expect(service.status()).toBe('running');
  });

  it('should pause timer', () => {
    service.initialize(DEFAULT_SETTINGS);
    service.start(DEFAULT_SETTINGS);
    service.pause();
    expect(service.status()).toBe('paused');
  });

  it('should reset timer', () => {
    service.initialize(DEFAULT_SETTINGS);
    service.start(DEFAULT_SETTINGS);
    service.reset();
    expect(service.status()).toBe('idle');
  });

  it('should calculate progress correctly', () => {
    service.initialize(DEFAULT_SETTINGS);
    const progress = service.progressPercentage();
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  it('should format time correctly', () => {
    service.initialize(DEFAULT_SETTINGS);
    const formatted = service.formattedTime();
    expect(formatted).toMatch(/^\d{2}:\d{2}$/);
  });
});
