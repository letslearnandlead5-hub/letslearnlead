// ─── Color Palette ────────────────────────────────────────────────────────────
// Based on LevelsUp design reference
export const Colors = {
  // Primary - Bright Blue (main action color)
  primary: '#0D7EFF',
  primaryDark: '#0A66CC',
  primaryLight: '#4DA3FF',
  
  // Secondary & Accent
  secondary: '#FF6B9D',
  accent: '#00C9FF',
  
  // Background - Light & Clean
  background: '#F5F7FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  
  // Text - Dark on Light
  text: '#1A1D29',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#0D7EFF',
  
  // UI Elements
  border: '#E5E7EB',
  divider: '#F3F4F6',
  overlay: 'rgba(0,0,0,0.5)',
  
  // Progress & Stats
  progressBlue: '#0D7EFF',
  progressBackground: '#E8F2FF',
  
  // Course Tags
  gold: '#FFC107',
  free: '#10B981',
  paid: '#0D7EFF',
  
  // Rating Star
  star: '#FFC107',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
// Clean, modern typography matching the reference
export const Typography = {
  // Headings
  h1: { 
    fontSize: 32, 
    fontWeight: '700' as const, 
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  h2: { 
    fontSize: 26, 
    fontWeight: '700' as const, 
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  h3: { 
    fontSize: 22, 
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: { 
    fontSize: 18, 
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  h5: { 
    fontSize: 16, 
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  
  // Body Text
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
  
  // Special
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
    fontWeight: '600' as const,
    letterSpacing: 0.2,
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
// Softer, more rounded corners like the reference
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
// Subtle shadows for depth
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

// ─── Gradients ────────────────────────────────────────────────────────────────
export const Gradients = {
  primary: ['#0D7EFF', '#0A66CC'] as [string, string],
  accent: ['#00C9FF', '#0D7EFF'] as [string, string],
  success: ['#10B981', '#059669'] as [string, string],
  card: ['#FFFFFF', '#F9FAFB'] as [string, string],
  progress: ['#0D7EFF', '#4DA3FF'] as [string, string],
  hero: ['#F5F7FA', '#FFFFFF'] as [string, string],
  splash: ['#F5F7FA', '#E8F2FF', '#FFFFFF'] as [string, string, string],
} as const;

// ─── Animation ────────────────────────────────────────────────────────────────
export const Animation = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

// ─── Layout ───────────────────────────────────────────────────────────────────
export const Layout = {
  screenPadding: 20,
  cardPadding: 16,
  buttonHeight: 50,
  inputHeight: 48,
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
} as const;
