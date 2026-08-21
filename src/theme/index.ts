import React, { createContext, useContext } from 'react';

export type ThemeColors = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  card: string;
  disabled: string;
  overlay: string;
  shadow: string;
  tabActive: string;
  tabInactive: string;
};

export const lightColors: ThemeColors = {
  primary: '#4A90D9',
  primaryLight: '#E6F0FF',
  primaryDark: '#2D6BB4',
  secondary: '#7C5CFC',
  secondaryLight: '#F0ECFF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  text: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  info: '#3B82F6',
  infoLight: '#EFF6FF',
  card: '#FFFFFF',
  disabled: '#CBD5E1',
  overlay: 'rgba(0,0,0,0.5)',
  shadow: '#000000',
  tabActive: '#4A90D9',
  tabInactive: '#94A3B8',
};

export const darkColors: ThemeColors = {
  primary: '#6BA3E0',
  primaryLight: '#1A2A3A',
  primaryDark: '#5B8DC9',
  secondary: '#9B82FF',
  secondaryLight: '#1E1A2A',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#283548',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  borderLight: '#1E293B',
  success: '#34D399',
  successLight: '#0A2E1F',
  warning: '#FBBF24',
  warningLight: '#2E2205',
  error: '#F87171',
  errorLight: '#2E1010',
  info: '#60A5FA',
  infoLight: '#0F1D2E',
  card: '#1E293B',
  disabled: '#475569',
  overlay: 'rgba(0,0,0,0.7)',
  shadow: '#000000',
  tabActive: '#6BA3E0',
  tabInactive: '#64748B',
};

export interface Theme {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

const layoutValues = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const lightTheme: Theme = {
  colors: lightColors,
  ...layoutValues,
};

export const darkTheme: Theme = {
  colors: darkColors,
  ...layoutValues,
};

export const ThemeContext = createContext<Theme>(lightTheme);

export const ThemeProvider = ({
  children,
  theme = lightTheme,
}: {
  children: React.ReactNode;
  theme?: Theme;
}) => {
  return React.createElement(ThemeContext.Provider, { value: theme }, children);
};

export const useTheme = (): Theme => {
  return useContext(ThemeContext);
};
