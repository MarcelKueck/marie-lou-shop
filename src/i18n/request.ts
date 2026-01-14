import { getRequestConfig } from 'next-intl/server';
import { routing, Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate that the incoming locale is valid
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  // Load common messages
  const commonMessages = (await import(`./messages/${locale}/common.json`)).default;
  
  // Load B2B messages
  const b2bMessages = (await import(`./messages/${locale}/b2b.json`)).default;

  return {
    locale: locale as string,
    messages: {
      ...commonMessages,
      b2b: b2bMessages,
    },
  };
});
