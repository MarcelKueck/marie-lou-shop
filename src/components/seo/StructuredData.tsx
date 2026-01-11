export function OrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marieloucoffee.com';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Marie Lou Coffee',
    url: baseUrl,
    logo: `${baseUrl}/images/logos/marieloucoffee.png`,
    description: 'Specialty Coffee Roastery - Fresh roasted, direct trade coffee from Germany',
    foundingDate: '2024',
    founder: {
      '@type': 'Person',
      name: 'Marcel',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'DE',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@marieloucoffee.com',
    },
    sameAs: [
      // Add social media links when available
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marieloucoffee.com';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Marie Lou Coffee',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/de/shop?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ProductSchemaProps {
  product: {
    id: string;
    name: string;
    description: string;
    image?: string;
    basePrice: number;
    variants: { id: string; name: string; priceModifier: number }[];
  };
  rating?: { value: number; count: number };
}

export function ProductSchema({ product, rating }: ProductSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marieloucoffee.com';
  const minPrice = (product.basePrice + Math.min(...product.variants.map(v => v.priceModifier))) / 100;
  const maxPrice = (product.basePrice + Math.max(...product.variants.map(v => v.priceModifier))) / 100;
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image ? `${baseUrl}${product.image}` : undefined,
    url: `${baseUrl}/de/shop/${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'Marie Lou Coffee',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: minPrice.toFixed(2),
      highPrice: maxPrice.toFixed(2),
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Marie Lou Coffee',
      },
    },
    ...(rating && rating.count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.value.toFixed(1),
        reviewCount: rating.count,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbSchemaProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marieloucoffee.com';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQSchemaProps {
  questions: { question: string; answer: string }[];
}

export function FAQSchema({ questions }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
