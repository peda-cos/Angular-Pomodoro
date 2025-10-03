export interface ThemeDefinition {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    success: string;
    warning: string;
    border: string;
  };
}

export const DEFAULT_THEMES: ThemeDefinition[] = [
  {
    id: 'default',
    name: 'Default',
    colors: {
      primary: '#6366f1',
      secondary: '#a855f7',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
      error: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
      border: '#e5e7eb',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      primary: '#818cf8',
      secondary: '#c084fc',
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      textSecondary: '#9ca3af',
      error: '#f87171',
      success: '#34d399',
      warning: '#fbbf24',
      border: '#374151',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      primary: '#059669',
      secondary: '#0d9488',
      background: '#f0fdf4',
      surface: '#dcfce7',
      text: '#064e3b',
      textSecondary: '#047857',
      error: '#dc2626',
      success: '#10b981',
      warning: '#f59e0b',
      border: '#86efac',
    },
  },
];
