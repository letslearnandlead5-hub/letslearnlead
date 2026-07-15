// ─── Color Palette — Udemy-inspired Light Theme with Indigo Accent ──────────
export const Colors = {
  // Primary — Indigo (Unacademy/premium feel)
  primary: '#5B5FEF',
  primaryDark: '#4347D4',
  primaryLight: '#8B8FF5',
  primarySoft: '#EEF0FF',   // light tint for backgrounds/chips

  // Secondary — Warm Orange (energy, CTA highlights)
  secondary: '#FF6B35',
  secondaryLight: '#FF9E7A',
  secondarySoft: '#FFF0EB',

  // Accent — Teal (progress, success)
  accent: '#00C9A7',
  accentSoft: '#E6FAF7',

  // Background — Udemy-style crisp light
  background: '#F7F8FC',
  backgroundAlt: '#EEEFFE',  // subtle indigo tint section bg

  // Surface (cards, inputs)
  surface: '#FFFFFF',
  surfaceElevated: '#FAFBFF',  // slight tint for elevated cards

  // Text
  text: '#1C1D1F',          // Udemy's near-black
  textSecondary: '#6A6F73',  // Udemy's grey
  textMuted: '#A1A5AA',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',

  // Status
  success: '#1E9E6B',
  successSoft: '#E6FAF2',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  error: '#E53935',
  errorSoft: '#FFF0EE',
  info: '#5B5FEF',
  infoSoft: '#EEF0FF',

  // UI Elements
  border: '#E5E7EB',
  borderLight: '#F0F1F3',
  divider: '#F3F4F6',
  overlay: 'rgba(28, 29, 31, 0.6)',

  // Backward compatibility keys
  card: '#FFFFFF',
  cardElevated: '#FAFBFF',
  progressBackground: '#EEF0FF',

  // Progress
  progressTrack: '#EEF0FF',

  // Course tags
  gold: '#FFC107',
  free: '#1E9E6B',
  paid: '#5B5FEF',

  // Rating
  star: '#F5A623',

  // Tab bar
  tabActive: '#5B5FEF',
  tabInactive: '#9EA0B5',
  tabBackground: '#FFFFFF',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const Typography = {
  h1: {
    fontSize: 30,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  h5: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  h6: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  button: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  buttonSm: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.0,
    textTransform: 'uppercase' as const,
    lineHeight: 16,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const Shadows = {
  xs: {
    shadowColor: '#5B5FEF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#1C1D1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#1C1D1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1C1D1F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    shadowColor: '#5B5FEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  primary: {
    shadowColor: '#5B5FEF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 8,
  },
} as const;

// ─── Gradients ────────────────────────────────────────────────────────────────
export const Gradients = {
  primary: ['#5B5FEF', '#4347D4'] as [string, string],
  primaryLight: ['#8B8FF5', '#5B5FEF'] as [string, string],
  primarySoft: ['#EEF0FF', '#F7F8FC'] as [string, string],
  secondary: ['#FF6B35', '#FF9E7A'] as [string, string],
  accent: ['#00C9A7', '#00A58A'] as [string, string],
  hero: ['#5B5FEF', '#8B5CF6'] as [string, string],
  warmHero: ['#FF6B35', '#5B5FEF'] as [string, string],
  card: ['#FFFFFF', '#FAFBFF'] as [string, string],
  splash: ['#1C1D3A', '#2D2F6E', '#5B5FEF'] as [string, string, string],
  dark: ['#1C1D1F', '#2D2F3A'] as [string, string],
  // Category gradients
  school: ['#5B5FEF', '#8B8FF5'] as [string, string],
  neet: ['#E53935', '#EF5350'] as [string, string],
  jee: ['#F59E0B', '#FBB040'] as [string, string],
  kcet: ['#1E9E6B', '#34D399'] as [string, string],
  competitive: ['#9C27B0', '#AB47BC'] as [string, string],
  college: ['#00C9A7', '#26D3B5'] as [string, string],
  skills: ['#FF6B35', '#FF8A50'] as [string, string],
  upsc: ['#546E7A', '#78909C'] as [string, string],
} as const;

// ─── Animation ────────────────────────────────────────────────────────────────
export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { tension: 100, friction: 12 },
} as const;

// ─── Layout ───────────────────────────────────────────────────────────────────
export const Layout = {
  screenPadding: 20,
  cardPadding: 16,
  buttonHeight: 52,
  buttonHeightSm: 42,
  inputHeight: 52,
  tabBarHeight: 64,
  iconSize: {
    xs: 14,
    sm: 18,
    md: 22,
    lg: 28,
    xl: 44,
  },
} as const;

// ─── Course Card Constants ────────────────────────────────────────────────────
export const CardSizes = {
  thumbnailHeight: 160,
  thumbnailHeightSm: 120,
  horizontalCardWidth: 260,
  continueLearningWidth: 300,
} as const;
