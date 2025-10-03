import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { DEFAULT_THEMES, ThemeDefinition } from '../models/theme.model';
import { StorageService } from './storage.service';

const CURRENT_THEME_STORAGE_KEY = 'current_theme';
const CUSTOM_THEMES_STORAGE_KEY = 'custom_themes';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private storage = inject(StorageService);

  private readonly currentThemeIdSignal = signal<string>('default');
  private readonly customThemesSignal = signal<ThemeDefinition[]>([]);
  private readonly systemPrefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');

  readonly allThemes = computed(() => [...DEFAULT_THEMES, ...this.customThemesSignal()]);

  readonly currentTheme = computed(() => {
    const themeId = this.currentThemeIdSignal();
    return this.allThemes().find((theme) => theme.id === themeId) || DEFAULT_THEMES[0];
  });

  constructor() {
    this.loadCurrentThemeFromStorage();
    this.loadCustomThemesFromStorage();
    this.watchSystemThemePreference();

    effect(() => {
      this.applyThemeToDocument(this.currentTheme());
    });

    effect(() => {
      this.storage.set(CUSTOM_THEMES_STORAGE_KEY, this.customThemesSignal());
    });
  }

  private loadCurrentThemeFromStorage(): void {
    // First, try to load from settings
    const settings = this.storage.get<any>('settings');
    if (settings?.themeId) {
      this.currentThemeIdSignal.set(settings.themeId);
      return;
    }

    // Then try the old theme-specific storage key
    const savedThemeId = this.storage.get<string>(CURRENT_THEME_STORAGE_KEY);
    if (savedThemeId) {
      this.currentThemeIdSignal.set(savedThemeId);
    }
  }

  private loadCustomThemesFromStorage(): void {
    const savedCustomThemes = this.storage.get<ThemeDefinition[]>(CUSTOM_THEMES_STORAGE_KEY);
    if (savedCustomThemes) {
      this.customThemesSignal.set(savedCustomThemes);
    }
  }

  private watchSystemThemePreference(): void {
    this.systemPrefersDarkMode.addEventListener('change', (event) => {
      const hasUserSelectedTheme = this.storage.has(CURRENT_THEME_STORAGE_KEY);
      if (!hasUserSelectedTheme) {
        this.currentThemeIdSignal.set(event.matches ? 'dark' : 'default');
      }
    });
  }

  private applyThemeToDocument(theme: ThemeDefinition): void {
    const documentRoot = document.documentElement;

    Object.entries(theme.colors).forEach(([colorKey, colorValue]) => {
      documentRoot.style.setProperty(`--color-${colorKey}`, colorValue);
    });

    let metaThemeColorElement = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColorElement) {
      metaThemeColorElement = document.createElement('meta');
      metaThemeColorElement.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColorElement);
    }
    metaThemeColorElement.setAttribute('content', theme.colors.primary);
  }

  setTheme(themeId: string): void {
    this.currentThemeIdSignal.set(themeId);
  }

  addCustomTheme(theme: ThemeDefinition): void {
    this.customThemesSignal.update((themes) => [...themes, theme]);
  }

  updateCustomTheme(themeId: string, updates: Partial<ThemeDefinition>): void {
    this.customThemesSignal.update((themes) =>
      themes.map((theme) => (theme.id === themeId ? { ...theme, ...updates } : theme))
    );
  }

  deleteCustomTheme(themeId: string): void {
    this.customThemesSignal.update((themes) => themes.filter((theme) => theme.id !== themeId));

    if (this.currentThemeIdSignal() === themeId) {
      this.currentThemeIdSignal.set('default');
    }
  }
}
