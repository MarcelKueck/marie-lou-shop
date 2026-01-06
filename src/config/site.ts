export const siteConfig = {
  defaultLocale: 'de' as const,
  locales: ['de', 'en'] as const,
  
  taxRate: 19, // German VAT rate
  currency: 'EUR' as const,
  currencySymbol: '€',
  
  orderNumberPrefix: 'ML',
  
  support: {
    email: 'hello@marielou.de',
    phone: '+49 123 456 789',
  },
  
  social: {
    instagram: 'https://instagram.com/marieloucoffee',
  },
  
  legal: {
    companyName: 'Marie Lou Coffee UG (haftungsbeschränkt)',
    address: 'Musterstraße 123, 80331 München, Germany',
    vatId: 'DE123456789',
    registrationCourt: 'Amtsgericht München',
    registrationNumber: 'HRB 123456',
    managingDirector: 'Marcel',
  },
};

export type Locale = (typeof siteConfig.locales)[number];
