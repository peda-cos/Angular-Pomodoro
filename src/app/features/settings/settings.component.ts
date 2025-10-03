import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AudioService } from '../../core/services/audio.service';
import { SettingsService } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private settingsService = inject(SettingsService);
  private themeService = inject(ThemeService);
  private audioService = inject(AudioService);

  readonly settings = this.settingsService.currentSettings;
  readonly allThemes = this.themeService.allThemes;
  readonly currentTheme = this.themeService.currentTheme;

  readonly validationErrors = signal<string[]>([]);

  readonly soundThemeOptions: Array<{ value: 'soft' | 'bell' | 'none'; label: string }> = [
    { value: 'soft', label: 'Soft' },
    { value: 'bell', label: 'Bell' },
    { value: 'none', label: 'None' },
  ];

  readonly fontFamilyOptions = [
    { value: 'system-ui', label: 'System Default' },
    { value: '"Inter", sans-serif', label: 'Inter' },
    { value: '"Roboto", sans-serif', label: 'Roboto' },
    { value: '"Open Sans", sans-serif', label: 'Open Sans' },
    { value: 'monospace', label: 'Monospace' },
  ];

  updateWorkMinutes(value: string): void {
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue)) {
      this.updateSettingWithValidation({ workMinutes: numericValue });
    }
  }

  updateShortBreakMinutes(value: string): void {
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue)) {
      this.updateSettingWithValidation({ shortBreakMinutes: numericValue });
    }
  }

  updateLongBreakMinutes(value: string): void {
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue)) {
      this.updateSettingWithValidation({ longBreakMinutes: numericValue });
    }
  }

  updateSessionsBeforeLongBreak(value: string): void {
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue)) {
      this.updateSettingWithValidation({ sessionsBeforeLongBreak: numericValue });
    }
  }

  updateVolume(value: string): void {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      this.updateSettingWithValidation({ volume: numericValue });
    }
  }

  updateSoundTheme(value: 'soft' | 'bell' | 'none'): void {
    this.updateSettingWithValidation({ soundTheme: value });
  }

  updateTheme(themeId: string): void {
    this.themeService.setTheme(themeId);
    this.updateSettingWithValidation({ themeId });
  }

  updateFontFamily(value: string): void {
    document.documentElement.style.setProperty('--font-family', value);
    this.updateSettingWithValidation({ fontFamily: value });
  }

  updateMuteWork(value: boolean): void {
    this.updateSettingWithValidation({ muteWork: value });
  }

  updateMuteBreak(value: boolean): void {
    this.updateSettingWithValidation({ muteBreak: value });
  }

  private updateSettingWithValidation(
    settingUpdate: Parameters<typeof this.settingsService.updateSettings>[0]
  ): void {
    const errors = this.settingsService.validateSettings(settingUpdate);

    if (errors.length > 0) {
      this.validationErrors.set(errors);
      return;
    }

    this.validationErrors.set([]);
    this.settingsService.updateSettings(settingUpdate);
  }

  async testSound(): Promise<void> {
    const currentSettings = this.settings();
    await this.audioService.playSound(currentSettings.soundTheme, currentSettings.volume);
  }

  resetToDefaults(): void {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      this.settingsService.resetToDefaults();
      this.validationErrors.set([]);
    }
  }
}
