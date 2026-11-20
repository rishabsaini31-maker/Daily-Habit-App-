/**
 * Design Tokens & Theme Configuration
 * Obsidian Digital Well-being & Screen-Time Blocker Design System
 */

export const colors = {
  // Primary Obsidian Backgrounds
  obsidian: '#08090D',
  obsidianElevated: '#0D0F17',
  obsidianDeep: '#040508',

  // Elevated Card Surfaces
  elevatedCardSurface: '#12141D',
  elevatedCardHover: '#181B27',
  glassSurface: 'rgba(18, 20, 29, 0.85)',
  glassOverlay: 'rgba(8, 9, 13, 0.75)',

  // Borders & Dividers
  hairlineBorder: '#1E2230',
  borderMuted: '#171A24',
  borderHighlight: '#2A3044',

  // Text Hierarchy
  primaryText: '#FFFFFF',
  secondaryMutedText: '#8A94A6',
  tertiaryText: '#525B6C',

  // Primary Accent (Focus / Active State)
  primaryAccent: '#38BDF8', // Cyan
  primaryAccentGlow: 'rgba(56, 189, 248, 0.25)',
  primaryAccentDark: '#0284C7',

  // Positive Accent (Saved / Time Reclaimed / Success)
  positiveAccent: '#10B981', // Emerald
  positiveAccentGlow: 'rgba(16, 185, 129, 0.25)',
  positiveAccentDark: '#059669',

  // Warning & Caution
  warningAccent: '#F59E0B', // Amber
  warningGlow: 'rgba(245, 158, 11, 0.25)',

  // Danger & Locked State (Shield / Block Interception)
  dangerAccent: '#EF4444', // Rose / Red
  dangerAccentGlow: 'rgba(239, 68, 68, 0.25)',

  // CTA Pill Button Tokens
  primaryButtonBg: '#FFFFFF',
  primaryButtonText: '#090A0F',
  secondaryButtonBg: '#1E2230',
  secondaryButtonText: '#FFFFFF',

  // Category Colors
  categorySocial: '#EC4899',
  categoryEntertainment: '#A855F7',
  categoryGaming: '#F97316',
  categoryProductivity: '#3B82F6',
  categoryShopping: '#14B8A6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screenPadding: 20,
} as const;

export const borderRadius = {
  sm: 8,
  md: 14,
  lg: 18,
  card: 24, // 24px border radius for cards per spec
  pill: 9999, // Circular pill
} as const;

export const typography = {
  displayLarge: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    color: colors.primaryText,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: 26,
    fontWeight: '700' as const,
    lineHeight: 34,
    color: colors.primaryText,
    letterSpacing: -0.3,
  },
  titleLarge: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: colors.primaryText,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    color: colors.primaryText,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.primaryText,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: colors.secondaryMutedText,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    color: colors.secondaryMutedText,
  },
  caption: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: colors.secondaryMutedText,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 22,
    color: colors.primaryButtonText,
  },
} as const;

export const layout = {
  cardPadding: 20, // 20px padding per spec
  hairlineBorderWidth: 1, // 1px hairline border per spec
  ctaButtonHeight: 54, // 54px height pill per spec
} as const;

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  layout,
};

export default theme;
