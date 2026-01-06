import { BrandConfig } from './types';

export const teaBrand: BrandConfig = {
  id: 'tea',
  name: 'Marie Lou Tea',
  domain: 'marieloutea.com',
  tagline: {
    en: 'Handpicked, Thoughtfully Blended',
    de: 'Handverlesen, sorgfältig gemischt',
  },

  logo: '/images/logos/marieloutea.svg',
  logoWhite: '/images/logos/marieloutea.svg',

  fonts: {
    display: 'Playfair Display',
    body: 'DM Sans',
  },

  // Elegant sage green palette - calming, natural, premium
  colors: {
    cream: '#F8FAF7',
    warmWhite: '#FDFFF9',
    primary: '#3A5A40',
    primaryMedium: '#588157',
    primaryLight: '#81A784',
    accent: '#A7C4A0',
    accentLight: '#DAE5D8',
    text: '#1E2E22',
    textMuted: '#5C6B5E',
  },

  email: 'hello@marieloutea.com',
  social: {
    instagram: 'marieloutea',
  },
};
