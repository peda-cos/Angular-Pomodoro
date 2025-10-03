import { Injectable, computed, inject } from '@angular/core';
import { DailyStats, StatisticsSnapshot, WeeklyStats } from '../models/statistics.model';
import { HistoryService } from './history.service';
import { TaskService } from './task.service';

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private historyService = inject(HistoryService);
  private taskService = inject(TaskService);

  readonly todayStats = computed(() => this.calculateDailyStats(new Date()));
  readonly weeklyStats = computed(() => this.calculateWeeklyStats(new Date()));

  calculateDailyStats(date: Date): DailyStats {
    const dateString = date.toISOString().split('T')[0];
    const sessionsForDate = this.historyService
      .allSessions()
      .filter((session) => session.startedAt.startsWith(dateString) && !session.interrupted);

    const completedWorkSessions = sessionsForDate.filter((session) => session.type === 'work');
    const totalFocusMinutes = Math.floor(
      completedWorkSessions.reduce(
        (totalSeconds, session) => totalSeconds + session.durationSeconds,
        0
      ) / 60
    );
    const pomodorosCompletedCount = completedWorkSessions.length;
    const averageSessionLengthMinutes =
      pomodorosCompletedCount > 0 ? Math.floor(totalFocusMinutes / pomodorosCompletedCount) : 0;

    return {
      date: dateString,
      totalMinutes: totalFocusMinutes,
      pomodorosCompleted: pomodorosCompletedCount,
      sessionsCompleted: sessionsForDate.length,
      averageSessionLength: averageSessionLengthMinutes,
    };
  }

  calculateWeeklyStats(endDate: Date): WeeklyStats {
    const weekEndDate = new Date(endDate);
    weekEndDate.setHours(23, 59, 59, 999);

    const weekStartDate = new Date(weekEndDate);
    weekStartDate.setDate(weekStartDate.getDate() - 6);
    weekStartDate.setHours(0, 0, 0, 0);

    const sessionsInWeek = this.historyService.getSessionsByDateRange(weekStartDate, weekEndDate);
    const completedWorkSessionsInWeek = sessionsInWeek.filter(
      (session) => session.type === 'work' && !session.interrupted
    );

    const totalFocusMinutes = Math.floor(
      completedWorkSessionsInWeek.reduce(
        (totalSeconds, session) => totalSeconds + session.durationSeconds,
        0
      ) / 60
    );
    const pomodorosCompletedCount = completedWorkSessionsInWeek.length;

    const dailyStatisticsBreakdown: DailyStats[] = [];
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(weekStartDate.getDate() + dayOffset);
      dailyStatisticsBreakdown.push(this.calculateDailyStats(currentDate));
    }

    const taskFocusMap = new Map<string, { minutes: number; pomodoros: number }>();
    completedWorkSessionsInWeek.forEach((session) => {
      if (session.taskId) {
        const currentTaskStats = taskFocusMap.get(session.taskId) || { minutes: 0, pomodoros: 0 };
        taskFocusMap.set(session.taskId, {
          minutes: currentTaskStats.minutes + Math.floor(session.durationSeconds / 60),
          pomodoros: currentTaskStats.pomodoros + 1,
        });
      }
    });

    const topFocusedTasks = Array.from(taskFocusMap.entries())
      .map(([taskId, statistics]) => {
        const task = this.taskService.getTaskById(taskId);
        return {
          taskId,
          taskTitle: task?.title || 'Unknown Task',
          minutes: statistics.minutes,
          pomodoros: statistics.pomodoros,
        };
      })
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    return {
      startDate: weekStartDate.toISOString().split('T')[0],
      endDate: weekEndDate.toISOString().split('T')[0],
      totalMinutes: totalFocusMinutes,
      pomodorosCompleted: pomodorosCompletedCount,
      dailyBreakdown: dailyStatisticsBreakdown,
      topTasks: topFocusedTasks,
    };
  }

  getTaskStatistics(taskId: string): { totalMinutes: number; pomodorosCompleted: number } {
    const taskSessions = this.historyService.getSessionsByTask(taskId);
    const completedWorkSessions = taskSessions.filter(
      (session) => session.type === 'work' && !session.interrupted
    );

    return {
      totalMinutes: Math.floor(
        completedWorkSessions.reduce(
          (totalSeconds, session) => totalSeconds + session.durationSeconds,
          0
        ) / 60
      ),
      pomodorosCompleted: completedWorkSessions.length,
    };
  }

  generateSnapshot(date: Date): StatisticsSnapshot {
    const dateIsoString = date.toISOString().split('T')[0];
    const completedWorkSessionsForDate = this.historyService
      .allSessions()
      .filter(
        (session) =>
          session.startedAt.startsWith(dateIsoString) &&
          session.type === 'work' &&
          !session.interrupted
      );

    const taskFocusMap = new Map<string, { workMinutes: number; pomodoros: number }>();
    completedWorkSessionsForDate.forEach((session) => {
      if (session.taskId) {
        const currentTaskStats = taskFocusMap.get(session.taskId) || {
          workMinutes: 0,
          pomodoros: 0,
        };
        taskFocusMap.set(session.taskId, {
          workMinutes: currentTaskStats.workMinutes + Math.floor(session.durationSeconds / 60),
          pomodoros: currentTaskStats.pomodoros + 1,
        });
      }
    });

    return {
      dateISO: dateIsoString,
      workMinutes: Math.floor(
        completedWorkSessionsForDate.reduce(
          (totalSeconds, session) => totalSeconds + session.durationSeconds,
          0
        ) / 60
      ),
      pomodorosCompleted: completedWorkSessionsForDate.length,
      byTask: Array.from(taskFocusMap.entries()).map(([taskId, statistics]) => ({
        taskId,
        ...statistics,
      })),
    };
  }
}
