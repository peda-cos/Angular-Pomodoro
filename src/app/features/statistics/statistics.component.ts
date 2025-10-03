import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { StatisticsService } from '../../core/services/statistics.service';

@Component({
  selector: 'app-statistics',
  imports: [CommonModule],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsComponent {
  private statisticsService = inject(StatisticsService);

  readonly todayStats = this.statisticsService.todayStats;
  readonly weeklyStats = this.statisticsService.weeklyStats;

  readonly maximumDailyMinutes = computed(() => {
    const dailyStatistics = this.weeklyStats().dailyBreakdown;
    return Math.max(...dailyStatistics.map((day) => day.totalMinutes), 1);
  });

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  formatDay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }

  getBarHeight(minutes: number): number {
    const maximumMinutes = this.maximumDailyMinutes();
    return maximumMinutes > 0 ? (minutes / maximumMinutes) * 100 : 0;
  }
}
