// Police Marianne (Design System de l'État)
// Pour activer la police officielle, déposer les fichiers TTF dans assets/fonts/
// et remplacer les valeurs ci-dessous par les noms de police correspondants.
export const FontFamily = {
  regular: 'System',  // 'Marianne-Regular'
  medium: 'System',   // 'Marianne-Medium'
  bold: 'System',     // 'Marianne-Bold'
  light: 'System',    // 'Marianne-Light'
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
} as const;

export const FontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
