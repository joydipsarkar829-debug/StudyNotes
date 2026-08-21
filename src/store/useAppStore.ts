import { create } from 'zustand';
import { db } from '../database';

interface AppState {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: number;
  isOnboarded: boolean;
  isLoading: boolean;
  dbInitialized: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setOnboarded: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setDbInitialized: (value: boolean) => void;
  loadSettings: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'system',
  accentColor: '#4A90D9',
  fontSize: 16,
  isOnboarded: false,
  isLoading: false,
  dbInitialized: false,

  setTheme: (theme) => {
    set({ theme });
    db.setSetting('theme', theme);
  },

  setAccentColor: (accentColor) => {
    set({ accentColor });
    db.setSetting('accentColor', accentColor);
  },

  setFontSize: (fontSize) => {
    set({ fontSize });
    db.setSetting('fontSize', fontSize.toString());
  },

  setOnboarded: (isOnboarded) => {
    set({ isOnboarded });
    db.setSetting('isOnboarded', isOnboarded.toString());
  },

  setLoading: (isLoading) => set({ isLoading }),

  setDbInitialized: (dbInitialized) => set({ dbInitialized }),

  loadSettings: () => {
    const theme = db.getSettings('theme') as 'light' | 'dark' | 'system' | null;
    const accentColor = db.getSettings('accentColor');
    const fontSize = db.getSettings('fontSize');
    const isOnboarded = db.getSettings('isOnboarded');

    set({
      theme: theme ?? 'system',
      accentColor: accentColor ?? '#4A90D9',
      fontSize: fontSize ? parseInt(fontSize, 10) : 16,
      isOnboarded: isOnboarded === 'true',
    });
  },
}));
