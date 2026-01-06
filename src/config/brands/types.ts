// Brand configuration types

export interface BrandColors {
  cream: string;
  warmWhite: string;
  primary: string;
  primaryMedium: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  text: string;
  textMuted: string;
}

export interface BrandFonts {
  display: string;
  body: string;
}

export interface BrandSocial {
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

export interface BrandConfig {
  id: 'coffee' | 'tea';
  name: string;
  domain: string;
  tagline: {
    en: string;
    de: string;
  };
  
  logo: string;
  logoWhite: string;
  
  fonts: BrandFonts;
  colors: BrandColors;
  
  email: string;
  social: BrandSocial;
}

export type BrandId = 'coffee' | 'tea';
