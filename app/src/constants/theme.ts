/** Design tokens derived from the website (assets/css/main.css) and the logo. */
export const Colors = {
  ink: '#2c2a2a',
  inkRaised: '#3a3636',
  page: '#ffffff',
  surface: '#f6f6f6',
  border: '#e5e2e2',
  heading: '#2c2a2a',
  text: '#585858',
  muted: '#8a8585',
  onDark: '#ffffff',
  onDarkMuted: 'rgba(255,255,255,0.72)',
  accent: '#e8590c',
  gold: '#ffd47a',
  open: '#2f9e5b',
  closed: '#c0392b',
  noticeBg: '#3a2a1a',
  noticeText: '#ffd9a8',
  warningBg: '#5a1f16',
  /** Event card gradient (.event-announcement) */
  event: ['#2a1c1f', '#4a2b32', '#2b1a20'] as const,
  /** Calendar teaser gradient on the homepage */
  calendar: ['#1a5490', '#2d7ab8'] as const,
  /** Sunset gradient from the logo */
  sunset: ['#f9e10f', '#f9a01b', '#f2541b', '#e81f10'] as const,
} as const;

export const Fonts = {
  light: 'SourceSans3_300Light',
  regular: 'SourceSans3_400Regular',
  italic: 'SourceSans3_400Regular_Italic',
  bold: 'SourceSans3_700Bold',
  black: 'SourceSans3_900Black',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 6,
  md: 12,
  lg: 20,
} as const;

export const MaxContentWidth = 720;
