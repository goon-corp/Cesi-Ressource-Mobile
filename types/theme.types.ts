export type ThemeMode = 'light' | 'dark' | 'system';

export interface ColorScheme {
  // Backgrounds
  background: string;
  backgroundAlt: string;
  surface: string;

  // Text
  text: string;
  textMuted: string;
  textLight: string;
  textOnPrimary: string;

  // Brand (DSFR - Bleu France)
  primary: string;
  primaryLight: string;
  primaryPressed: string;

  // Status
  error: string;
  errorLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;

  // UI elements
  border: string;
  borderLight: string;
  divider: string;

  // Input
  inputBackground: string;
  inputBorder: string;
  inputBorderFocus: string;
  placeholder: string;
}
