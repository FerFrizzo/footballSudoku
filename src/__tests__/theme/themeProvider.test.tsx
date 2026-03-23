/**
 * Tests for ThemeProvider colour utilities.
 *
 * The helper functions (getLuminance, lighten, getContrastText, etc.) are
 * internal to ThemeProvider.tsx and not exported.  We exercise them
 * indirectly by rendering a <ThemeProvider> consumer and asserting on the
 * resulting theme object.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider, useTheme, type Theme } from '../../theme/ThemeProvider';
import type { ClubProfile } from '../../types';

// Auto-mock the game store so ThemeProvider can be rendered in isolation
jest.mock('../../state/gameStore');
import { useGameStore } from '../../state/gameStore';
const mockUseGameStore = useGameStore as jest.Mock;

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Render ThemeProvider with a given club (or null) and capture the theme. */
function getTheme(club: ClubProfile | null = null): Theme {
  mockUseGameStore.mockImplementation((selector: (s: any) => any) =>
    selector({ club })
  );

  let captured!: Theme;
  const Consumer = () => {
    captured = useTheme();
    return null;
  };

  render(
    <ThemeProvider>
      <Consumer />
    </ThemeProvider>
  );

  return captured;
}

const DARK_GREEN = '#1B5E20';   // luminance ≈ 0.097  (dark, < 0.4)
const YELLOW = '#FFD600';       // luminance ≈ 0.699  (light, > 0.4)
const WHITE = '#FFFFFF';        // luminance = 1.0    (very light)
const VERY_LIGHT = '#F9FBE7';   // luminance ≈ 0.94   (above 0.92 safe-highlight threshold)

// ─── Default theme (no club) ─────────────────────────────────────────────────

describe('ThemeProvider — default theme (no club)', () => {
  it('uses the hardcoded default primary colour', () => {
    const theme = getTheme(null);
    expect(theme.primary).toBe(DARK_GREEN);
  });

  it('uses the hardcoded default secondary colour', () => {
    const theme = getTheme(null);
    expect(theme.secondary).toBe('#FFD600');
  });

  it('exposes default cell highlight colours', () => {
    const theme = getTheme(null);
    expect(theme.cellHighlight).toBe('#E8F5E9');
    expect(theme.cellSelected).toBe('#C8E6C9');
    expect(theme.cellSameNumber).toBe('#DCEDC8');
  });

  it('surface and background are always light', () => {
    const theme = getTheme(null);
    expect(theme.surface).toBe('#FFFFFF');
    expect(theme.background).toBe('#F5F5F0');
  });

  it('error and success colours are consistent with the defaults', () => {
    const theme = getTheme(null);
    expect(theme.error).toBe('#D32F2F');
    expect(theme.success).toBe('#388E3C');
  });
});

// ─── Dark primary colour ──────────────────────────────────────────────────────

describe('ThemeProvider — dark primary colour', () => {
  const club: ClubProfile = {
    name: 'Forest FC',
    badgeUri: null,
    primaryColor: DARK_GREEN,
    secondaryColor: YELLOW,
  };

  it('sets textOnPrimary to white for a dark primary', () => {
    const theme = getTheme(club);
    expect(theme.textOnPrimary).toBe('#FFFFFF');
  });

  it('keeps the given primary colour', () => {
    const theme = getTheme(club);
    expect(theme.primary).toBe(DARK_GREEN);
  });

  it('primaryOnSurface equals the primary colour when it is already dark enough', () => {
    // Dark green has luminance ≈ 0.097 which is ≤ 0.3, so it is readable on white
    const theme = getTheme(club);
    expect(theme.primaryOnSurface).toBe(DARK_GREEN);
  });

  it('cellHighlight is NOT the fallback for a dark primary (lightened colour is usable)', () => {
    const theme = getTheme(club);
    // lighten('#1B5E20', 0.85) produces a pale green ≈ #dde7de with luminance < 0.92
    expect(theme.cellHighlight).not.toBe('#F0F0F0');
  });
});

// ─── Light / yellow secondary colour ─────────────────────────────────────────

describe('ThemeProvider — light secondary colour', () => {
  const club: ClubProfile = {
    name: 'Canaries',
    badgeUri: null,
    primaryColor: DARK_GREEN,
    secondaryColor: YELLOW,
  };

  it('sets textOnSecondary to dark text for a light secondary', () => {
    // Yellow has luminance ≈ 0.699 > 0.4 → dark text
    const theme = getTheme(club);
    expect(theme.textOnSecondary).toBe('#1A1A1A');
  });

  it('starFilled uses the secondary colour when it is dark enough', () => {
    // #FFD600 luminance ≈ 0.699 which is ≤ 0.85 → colour is used directly
    const theme = getTheme(club);
    expect(theme.starFilled).toBe(YELLOW);
  });
});

// ─── White / very-light primary → safety fallbacks ───────────────────────────

describe('ThemeProvider — very light primary (safety fallbacks)', () => {
  const club: ClubProfile = {
    name: 'Whites FC',
    badgeUri: null,
    primaryColor: WHITE,
    secondaryColor: WHITE,
  };

  it('cellHighlight falls back when the lightened primary is near-white', () => {
    // lighten('#FFFFFF', 0.85) = '#ffffff', luminance 1.0 > 0.92 → fallback
    const theme = getTheme(club);
    expect(theme.cellHighlight).toBe('#F0F0F0');
  });

  it('cellSelected falls back when the lightened primary is near-white', () => {
    const theme = getTheme(club);
    expect(theme.cellSelected).toBe('#E0E0E0');
  });

  it('cellSameNumber falls back when the lightened secondary is near-white', () => {
    const theme = getTheme(club);
    expect(theme.cellSameNumber).toBe('#F5F5F5');
  });

  it('starFilled falls back when the secondary is too light', () => {
    // '#FFFFFF' luminance 1.0 > 0.85 → fallback '#F0A500'
    const theme = getTheme(club);
    expect(theme.starFilled).toBe('#F0A500');
  });

  it('textOnPrimary is dark text for a white primary', () => {
    const theme = getTheme(club);
    expect(theme.textOnPrimary).toBe('#1A1A1A');
  });

  it('primaryOnSurface is dark fallback when primary is too light for white bg', () => {
    // White luminance 1.0 > 0.3 → ensureReadableOnSurface returns '#1A1A1A'
    const theme = getTheme(club);
    expect(theme.primaryOnSurface).toBe('#1A1A1A');
  });
});

// ─── Very-light-but-not-pure-white primary ────────────────────────────────────

describe('ThemeProvider — very-light-but-not-white primary (#F9FBE7)', () => {
  const club: ClubProfile = {
    name: 'Pale FC',
    badgeUri: null,
    primaryColor: VERY_LIGHT,  // luminance ≈ 0.94
    secondaryColor: DARK_GREEN,
  };

  it('cellHighlight falls back because the lightened primary exceeds the 0.92 threshold', () => {
    const theme = getTheme(club);
    expect(theme.cellHighlight).toBe('#F0F0F0');
  });

  it('starFilled does NOT fall back since secondary is dark enough', () => {
    // dark-green secondary, safeDecorative allows it
    const theme = getTheme(club);
    expect(theme.starFilled).not.toBe('#F0A500');
  });
});

// ─── Invariants across all colour combinations ────────────────────────────────

describe('ThemeProvider — theme invariants', () => {
  const clubs: Array<ClubProfile | null> = [
    null,
    { name: 'A', badgeUri: null, primaryColor: DARK_GREEN, secondaryColor: YELLOW },
    { name: 'B', badgeUri: null, primaryColor: YELLOW, secondaryColor: DARK_GREEN },
    { name: 'C', badgeUri: null, primaryColor: WHITE, secondaryColor: WHITE },
    { name: 'D', badgeUri: null, primaryColor: '#E53935', secondaryColor: '#1565C0' },
  ];

  it.each(clubs)(
    'surface is always #FFFFFF regardless of club: %o',
    (club) => {
      expect(getTheme(club).surface).toBe('#FFFFFF');
    }
  );

  it.each(clubs)(
    'error colour is always #D32F2F regardless of club: %o',
    (club) => {
      expect(getTheme(club).error).toBe('#D32F2F');
    }
  );

  it.each(clubs)(
    'starEmpty is always #E0E0E0 regardless of club: %o',
    (club) => {
      expect(getTheme(club).starEmpty).toBe('#E0E0E0');
    }
  );
});
