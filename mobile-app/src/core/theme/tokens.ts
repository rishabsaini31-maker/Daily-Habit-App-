/**
 * Design Tokens & Theme Configuration
 * Obsidian Digital Well-being & Screen-Time Blocker Design System
 */

export const colors = {
  // Primary Obsidian Backgrounds
  obsidian: '#0B111D',
  obsidianElevated: '#101A2A',
  obsidianDeep: '#080D17',

  // Elevated Card Surfaces
  elevatedCardSurface: '#152238',
  elevatedCardHover: '#1C2B43',
  glassSurface: 'rgba(21, 34, 56, 0.92)',
  glassOverlay: 'rgba(8, 13, 23, 0.78)',

  // Borders & Dividers
  hairlineBorder: '#26364E',
  borderMuted: '#1A2940',
  borderHighlight: '#344967',

  // Text Hierarchy
  primaryText: '#FFFFFF',
  secondaryMutedText: '#9AA9C1',
  tertiaryText: '#687A95',

  // Primary Accent (Focus / Active State)
  primaryAccent: '#A9B9FF',
  primaryAccentGlow: 'rgba(169, 185, 255, 0.22)',
  primaryAccentDark: '#8298ED',

  // Positive Accent (Saved / Time Reclaimed / Success)
  positiveAccent: '#72D8B5',
  positiveAccentGlow: 'rgba(114, 216, 181, 0.2)',
  positiveAccentDark: '#42B894',

  // Warning & Caution
  warningAccent: '#E8B96E',
  warningGlow: 'rgba(232, 185, 110, 0.2)',

  // Danger & Locked State (Shield / Block Interception)
  dangerAccent: '#E88791',
  dangerAccentGlow: 'rgba(232, 135, 145, 0.2)',

  // CTA Pill Button Tokens
  primaryButtonBg: '#A9B9FF',
  primaryButtonText: '#111A2B',
  secondaryButtonBg: '#20314B',
  secondaryButtonText: '#FFFFFF',

  // Category Colors
  categorySocial: '#D28AB1',
  categoryEntertainment: '#B19AE8',
  categoryGaming: '#E5A06F',
  categoryProductivity: '#A9B9FF',
  categoryShopping: '#72D8B5',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screenPadding: 18,
} as const;

export const borderRadius = {
  sm: 8,
  md: 14,
  lg: 18,
  card: 18,
  pill: 9999, // Circular pill
} as const;

export const typography = {
  displayLarge: {
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 39,
    color: colors.primaryText,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: 25,
    fontWeight: '500' as const,
    lineHeight: 32,
    color: colors.primaryText,
    letterSpacing: -0.3,
  },
  titleLarge: {
    fontSize: 20,
    fontWeight: '500' as const,
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
  cardPadding: 16,
  hairlineBorderWidth: 1, // 1px hairline border per spec
  ctaButtonHeight: 48,
} as const;

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  layout,
};

export default theme;
