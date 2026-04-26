// DailyDose+ Design Tokens
// Maps directly from CSS variables in DailyDose_Code.html

export const colors = {
  // Primary palette
  mint:    '#1fa97a',
  mintL:   '#e3f7f0',
  mintM:   '#a3dfc8',
  mintD:   '#0d6e51',

  // Neutrals
  navy:    '#0f1f2e',
  slate:   '#2c3e50',
  muted:   '#5f7080',
  border:  '#dde8e3',
  bg:      '#f7fbf9',
  white:   '#ffffff',

  // Accent colors
  amber:   '#f5a623',
  amberL:  '#fef3e7',
  amberD:  '#8a4e1a',
  rose:    '#d45d7a',
  roseL:   '#fdedf2',
  red:     '#e05252',
  redL:    '#fdeaea',
  blueL:   '#eaf2fb',
  blueD:   '#1a5c9a',

  // Semantic
  success: '#1fa97a',
  warning: '#f5a623',
  danger:  '#d45d7a',
  info:    '#1a5c9a',
} as const;

export const gradients = {
  primary:   ['#1fa97a', '#0d8a63'] as const,
  hero:      ['#0d6e51', '#1fa97a', '#0f1f2e'] as const,
  darkCard:  ['#0f1f2e', '#1a2e3f'] as const,
};

export type ColorKey = keyof typeof colors;
