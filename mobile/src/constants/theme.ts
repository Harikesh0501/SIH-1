/**
 * RAKSHAK-AAYUSH (रक्षा-आयुष) Mobile Design Tokens
 * Institutional Professional Light Theme (STRICTLY ZERO BLUE)
 * Designed for executive clarity, high readability, and clean defense aesthetics.
 */

export const THEME = {
  colors: {
    // Clean Institutional Light Palette
    background: '#F8FAFC',
    backgroundCard: '#FFFFFF',
    backgroundElevated: '#F1F5F9',
    surface: '#F1F5F9',
    surfaceHighlight: '#E2E8F0',

    // Primary Brand Accent: Deep Executive Slate / Charcoal (Authoritative & Professional)
    primary: '#0F172A',
    primaryHover: '#1E293B',
    primaryMuted: '#334155',
    primaryLight: '#475569',
    primaryGlow: 'rgba(15, 23, 42, 0.08)',

    // Subtle Health Green (Used sparingly for positive status & biometric indicator)
    accentGreen: '#16A34A',
    accentGreenBg: '#DCFCE7',
    accentGreenBorder: '#86EFAC',

    // Regimental Amber / Sovereign Gold (Institutional crests & statutory badges)
    gold: '#D97706',
    goldDark: '#92400E',
    goldLight: '#FEF3C7',
    goldBorder: '#FDE68A',

    // Borders & Dividers
    border: '#E2E8F0',
    borderLight: '#CBD5E1',
    borderFocus: '#0F172A',

    // High Legibility Typography
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    textDim: '#94A3B8',
    textInverse: '#FFFFFF',

    // Status Accents (ZERO BLUE)
    critical: '#DC2626',
    criticalBg: '#FEE2E2',
    criticalBorder: '#FCA5A5',

    warning: '#D97706',
    warningBg: '#FEF3C7',
    warningBorder: '#FDE68A',

    resilient: '#16A34A',
    resilientBg: '#DCFCE7',
    resilientBorder: '#86EFAC',

    // Badges
    badgeBackground: '#0F172A',
    badgeText: '#FFFFFF',
    badgeMuted: '#F1F5F9',
    badgeMutedText: '#334155',
  },
  typography: {
    header: {
      fontSize: 22,
      fontWeight: '800' as const,
      letterSpacing: 0.3,
      color: '#0F172A',
    },
    subHeader: {
      fontSize: 16,
      fontWeight: '700' as const,
      letterSpacing: 0.2,
      color: '#0F172A',
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: '#334155',
      lineHeight: 20,
    },
    caption: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: '#64748B',
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
    },
    mono: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: '#0F172A',
      letterSpacing: 0.5,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    full: 9999,
  },
};
