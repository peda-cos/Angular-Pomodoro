import { computed, Injectable, signal } from '@angular/core';
import { SessionRecord } from '../models/session-record.model';
import { StorageService } from './storage.service';

const SESSION_HISTORY_STORAGE_KEY = 'session_history';
const MAXIMUM_HISTORY_RECORDS = 1000;

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private readonly sessionHistorySignal = signal<SessionRecord[]>([]);

  readonly allSessions = this.sessionHistorySignal.asReadonly();
  readonly todaySessions = computed(() => {
    const todayDateString = new Date().toISOString().split('T')[0];
    return this.sessionHistorySignal().filter((session) =>
      session.startedAt.startsWith(todayDateString)
    );
  });

  constructor(private storage: StorageService) {
    this.loadHistoryFromStorage();
  }

  private loadHistoryFromStorage(): void {
    const storedHistory = this.storage.get<SessionRecord[]>(SESSION_HISTORY_STORAGE_KEY);
    if (storedHistory) {
      this.sessionHistorySignal.set(storedHistory);
    }
  }

  private saveHistoryToStorage(): void {
    this.storage.set(SESSION_HISTORY_STORAGE_KEY, this.sessionHistorySignal());
  }

  addSession(sessionRecord: SessionRecord): void {
    const updatedHistory = [...this.sessionHistorySignal()];
    updatedHistory.push(sessionRecord);

    if (updatedHistory.length > MAXIMUM_HISTORY_RECORDS) {
      updatedHistory.shift();
    }

    this.sessionHistorySignal.set(updatedHistory);
    this.saveHistoryToStorage();
  }

  getSessionsByDateRange(startDate: Date, endDate: Date): SessionRecord[] {
    const startDateIso = startDate.toISOString();
    const endDateIso = endDate.toISOString();

    return this.sessionHistorySignal().filter(
      (session) => session.startedAt >= startDateIso && session.startedAt <= endDateIso
    );
  }

  getSessionsByTask(taskId: string): SessionRecord[] {
    return this.sessionHistorySignal().filter((session) => session.taskId === taskId);
  }

  clearHistory(): void {
    this.sessionHistorySignal.set([]);
    this.storage.remove(SESSION_HISTORY_STORAGE_KEY);
  }

  undoLastSession(): SessionRecord | null {
    const allSessionRecords = this.sessionHistorySignal();
    if (allSessionRecords.length === 0) {
      return null;
    }

    const mostRecentSession = allSessionRecords[allSessionRecords.length - 1];
    this.sessionHistorySignal.set(allSessionRecords.slice(0, -1));
    this.saveHistoryToStorage();
    return mostRecentSession;
  }
}
