import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store and retrieve data', () => {
    const testData = { test: 'value' };
    service.set('test-key', testData);
    const retrieved = service.get<typeof testData>('test-key');
    expect(retrieved).toEqual(testData);
  });

  it('should return null for non-existent key', () => {
    const result = service.get('non-existent');
    expect(result).toBeNull();
  });

  it('should remove data', () => {
    service.set('test-key', 'value');
    service.remove('test-key');
    expect(service.get('test-key')).toBeNull();
  });

  it('should check if key exists', () => {
    service.set('test-key', 'value');
    expect(service.has('test-key')).toBe(true);
    expect(service.has('non-existent')).toBe(false);
  });

  it('should clear all prefixed storage', () => {
    service.set('key1', 'value1');
    service.set('key2', 'value2');
    service.clear();
    expect(service.get('key1')).toBeNull();
    expect(service.get('key2')).toBeNull();
  });
});
