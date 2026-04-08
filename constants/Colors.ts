import type { ColorScheme } from '@/types/theme.types';

// Palette officielle DSFR (Design System de l'État)
export const LightColors: ColorScheme = {
  background: '#FFFFFF',
  backgroundAlt: '#F6F6F6',
  surface: '#FFFFFF',

  text: '#161616',
  textMuted: '#666666',
  textLight: '#9C9C9C',
  textOnPrimary: '#FFFFFF',

  primary: '#000091',       // Bleu France
  primaryLight: '#E3E3FD',
  primaryPressed: '#1212FF',

  error: '#CE0500',
  errorLight: '#FFE9E9',
  success: '#18753C',
  successLight: '#B8FEC9',
  warning: '#B34000',
  warningLight: '#FFE9E3',
  info: '#0063CB',
  infoLight: '#E8EDFF',

  border: '#CECECE',
  borderLight: '#E7E7E7',
  divider: '#DDDDDD',

  inputBackground: '#FFFFFF',
  inputBorder: '#3A3A3A',
  inputBorderFocus: '#0A76F6',
  placeholder: '#929292',
};

// Palette sombre DSFR
export const DarkColors: ColorScheme = {
  background: '#1B1B35',
  backgroundAlt: '#13131F',
  surface: '#212139',

  text: '#E5E5E5',
  textMuted: '#9999C3',
  textLight: '#6666A0',
  textOnPrimary: '#FFFFFF',

  primary: '#8585F6',       // Bleu France clair (mode sombre)
  primaryLight: '#1A1A3E',
  primaryPressed: '#AAAAF4',

  error: '#FF6B6B',
  errorLight: '#2A1515',
  success: '#51DA6A',
  successLight: '#0F2A1A',
  warning: '#FFB347',
  warningLight: '#2A1A0A',
  info: '#5B9AFF',
  infoLight: '#0A1A3A',

  border: '#3B3B6B',
  borderLight: '#2B2B55',
  divider: '#2B2B55',

  inputBackground: '#2A2A4A',
  inputBorder: '#6666A0',
  inputBorderFocus: '#8585F6',
  placeholder: '#6666A0',
};

export default { light: LightColors, dark: DarkColors };
