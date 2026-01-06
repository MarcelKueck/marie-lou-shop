import { BrandConfig } from './types';

export const coffeeBrand: BrandConfig = {
  id: 'coffee',
  name: 'Marie Lou Coffee',
  domain: 'marieloucoffee.com',
  tagline: {
    en: 'Freshly Roasted, Directly Sourced',
    de: 'Frisch geröstet, direkt bezogen',
  },

  logo: '/images/logos/marieloucoffee.svg',
  logoWhite: '/images/logos/marieloucoffee.svg',

  fonts: {
    display: 'Playfair Display',
    body: 'DM Sans',
  },

  colors: {
    cream: '#FAF7F2',
    warmWhite: '#FFFDF9',
    primary: '#3D2B1F',
    primaryMedium: '#5C4033',
    primaryLight: '#8B7355',
    accent: '#C4A77D',
    accentLight: '#E8DCC8',
    text: '#2D2118',
    textMuted: '#6B5D4D',
  },

  email: 'hello@marieloucoffee.com',
  social: {
    instagram: 'marieloucoffee',
  },
};
