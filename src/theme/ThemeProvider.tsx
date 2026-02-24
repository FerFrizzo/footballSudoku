import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useGameStore } from '../state/gameStore';

export interface Theme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textOnPrimary: string;
  textOnSecondary: string;
  error: string;
  success: string;
  border: string;
  gridLine: string;
  gridBorder: string;
  cellHighlight: string;
  cellSelected: string;
  cellSameNumber: string;
  starFilled: string;
  starEmpty: string;
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): number[] | null {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return null;
  return [
    parseInt(cleaned.substring(0, 2), 16),
    parseInt(cleaned.substring(2, 4), 16),
    parseInt(cleaned.substring(4, 6), 16),
  ];
}

function getContrastText(bgColor: string): string {
  return getLuminance(bgColor) > 0.4 ? '#1A1A1A' : '#FFFFFF';
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const result = rgb.map((c) => Math.min(255, Math.round(c + (255 - c) * amount)));
  return `#${result.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

const defaultTheme: Theme = {
  primary: '#1B5E20',
  secondary: '#FFD600',
  background: '#F5F5F0',
  surface: '#FFFFFF',
  surfaceAlt: '#EEEEEE',
  text: '#1A1A1A',
  textSecondary: '#757575',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#000000',
  error: '#D32F2F',
  success: '#388E3C',
  border: '#E0E0E0',
  gridLine: '#BDBDBD',
  gridBorder: '#424242',
  cellHighlight: '#E8F5E9',
  cellSelected: '#C8E6C9',
  cellSameNumber: '#DCEDC8',
  starFilled: '#FFD600',
  starEmpty: '#E0E0E0',
};

const ThemeContext = createContext<Theme>(defaultTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const club = useGameStore((s) => s.club);

  const theme = useMemo<Theme>(() => {
    if (!club) return defaultTheme;

    const primary = club.primaryColor || defaultTheme.primary;
    const secondary = club.secondaryColor || defaultTheme.secondary;

    return {
      primary,
      secondary,
      background: '#F5F5F0',
      surface: '#FFFFFF',
      surfaceAlt: '#EEEEEE',
      text: '#1A1A1A',
      textSecondary: '#757575',
      textOnPrimary: getContrastText(primary),
      textOnSecondary: getContrastText(secondary),
      error: '#D32F2F',
      success: '#388E3C',
      border: '#E0E0E0',
      gridLine: '#BDBDBD',
      gridBorder: '#424242',
      cellHighlight: lighten(primary, 0.85),
      cellSelected: lighten(primary, 0.7),
      cellSameNumber: lighten(secondary, 0.75),
      starFilled: secondary,
      starEmpty: '#E0E0E0',
    };
  }, [club]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
