/**
 * Design Tokens & Theme Configuration
 * Extracted from Figma: "Rishab" (DHI - Daily Habit Improvement)
 * Minimalist Obsidian, Periwinkle Ice & Sage Design System
 */

export const colors = {
  // Primary Obsidian / Midnight Backgrounds
  obsidian: '#090F18', // Figma canvas background
  obsidianOLED: '#000000', // Pure OLED Black option
  obsidianElevated: '#121D2B',
  obsidianDeep: '#05090F',

  // Elevated Card Surfaces
  elevatedCardSurface: '#121D2B',
  elevatedCardSubtle: '#152131',
  elevatedCardHover: '#1C2D47',
  glassSurface: 'rgba(20, 34, 54, 0.85)',
  glassOverlay: 'rgba(9, 15, 24, 0.82)',

  // Borders & Dividers
  hairlineBorder: '#29364B',
  hairlineBorderMuted: 'rgba(255, 255, 255, 0.08)',
  borderMuted: '#1E2B3E',
  borderHighlight: '#3B4E6B',

  // Text Hierarchy
  primaryText: '#F1F5FC',
  secondaryMutedText: '#A2ADBF',
  tertiaryText: '#75767E',
  subtleSlate: '#B0BBCD',

  // Accent Colors (Figma Specific)
  primaryAccent: '#B5C5FF', // Periwinkle Ice (Figma primary accent & button)
  primaryAccentGlow: 'rgba(181, 197, 255, 0.22)',
  primaryAccentDark: '#7890B3',

  // Positive Accent (Focus Zone & Health Step Tracker)
  positiveAccent: '#A5D9C8', // Figma Sage Emerald
  positiveEmerald: '#10B981', // Pure Emerald
  positiveAccentGlow: 'rgba(165, 217, 200, 0.22)',

  // Gems & Rewards (Warm Gold/Amber)
  gemAccent: '#E0C498',
  gemGlow: 'rgba(224, 196, 152, 0.22)',

  // Warning & Caution
  warningAccent: '#F59E0B',
  warningGlow: 'rgba(245, 158, 11, 0.22)',

  // Danger & Locked State (Shield / End Session)
  dangerAccent: '#C8AAB6', // Figma subtle muted rose
  dangerBright: '#EF4444',
  dangerAccentGlow: 'rgba(200, 170, 182, 0.22)',

  // CTA Pill Button Tokens
  primaryButtonBg: '#B5C5FF',
  primaryButtonText: '#10182D',
  primaryWhiteButtonBg: '#FFFFFF',
  primaryWhiteButtonText: '#000000',
  secondaryButtonBg: '#253957',
  secondaryButtonText: '#B5C5FF',
  iconCircleBg: '#181B26',

  // Monochrome Tokens
  monochromeLight: '#E4E4E7',
  monochromeDark: '#161920',

  // Category Colors
  categorySocial: '#B5C5FF',
  categoryEntertainment: '#A5D9C8',
  categoryGaming: '#E0C498',
  categoryProductivity: '#F1F5FC',
  categoryShopping: '#B0BBCD',
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
  lg: 19,
  card: 20, // 20px border radius per Figma cards
  pill: 9999, // Circular pill
} as const;

export const typography = {
  displayLarge: {
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 40,
    color: colors.primaryText,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: 26,
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
    lineHeight: 22,
    color: colors.primaryButtonText,
  },
} as const;

export const layout = {
  cardPadding: 18, // 18px padding per Figma cards
  hairlineBorderWidth: 1, // 1px hairline border per Figma
  ctaButtonHeight: 56, // 56px height pill button per Figma
} as const;

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  layout,
};

export default theme;
