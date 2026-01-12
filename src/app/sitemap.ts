import { MetadataRoute } from 'next';
import { getAllProducts } from '@/lib/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marieloucoffee.com';
  const locales = ['de', 'en'];
  
  const now = new Date();
  
  // Static pages
  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/shop', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/story', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/faq', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/shop/gift-card', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/legal/impressum', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/legal/datenschutz', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/legal/agb', priority: 0.3, changeFrequency: 'yearly' as const },
  ];
  
  // Generate URLs for static pages in all locales
  const staticUrls = staticPages.flatMap(page =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }))
  );
  
  // Fetch products from database
  const allProducts = await getAllProducts();
  
  // Generate URLs for products in all locales
  const productUrls = allProducts.flatMap(product =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}/shop/${product.id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  );
  
  return [...staticUrls, ...productUrls];
}
