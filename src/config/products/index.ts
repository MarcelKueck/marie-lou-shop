import { Product, CoffeeAttributes, TeaAttributes } from './types';
import { coffeeGrindVariants, teaFormatVariants } from './variants';

// Coffee Products
export const coffeeProducts: Product[] = [
  {
    id: 'ethiopia-yirgacheffe',
    slug: 'ethiopia-yirgacheffe',
    brand: 'coffee',
    active: true,
    name: { en: 'Yirgacheffe Natural', de: 'Yirgacheffe Natural' },
    origin: { en: 'Ethiopia', de: 'Äthiopien' },
    notes: { en: 'Blueberry, jasmine, honey sweetness', de: 'Blaubeere, Jasmin, Honigsüße' },
    description: {
      en: 'A stunning natural processed coffee from the birthplace of coffee. This single-origin gem offers an explosion of fruity flavors with delicate floral notes and a sweet, honey-like finish.',
      de: 'Ein atemberaubender naturbelassener Kaffee aus dem Geburtsland des Kaffees. Dieser Single-Origin-Schatz bietet eine Explosion von fruchtigen Aromen mit zarten Blumennoten und einem süßen, honigartigen Abgang.',
    },
    basePrice: 1490,
    currency: 'EUR',
    variants: coffeeGrindVariants,
    badge: 'bestseller',
    stockQuantity: 100,
    lowStockThreshold: 10,
    image: '/images/coffee/products/ethiopia-yirgacheffe.png',
    attributes: {
      type: 'coffee',
      roastLevel: 'light',
      process: 'natural',
      altitude: '1,800-2,200m',
      variety: 'Heirloom',
    } as CoffeeAttributes,
    averageRating: 4.9,
    reviewCount: 47,
  },
  {
    id: 'colombia-huila',
    slug: 'colombia-huila',
    brand: 'coffee',
    active: true,
    name: { en: 'Huila Supremo', de: 'Huila Supremo' },
    origin: { en: 'Colombia', de: 'Kolumbien' },
    notes: { en: 'Caramel, red apple, milk chocolate', de: 'Karamell, roter Apfel, Milchschokolade' },
    description: {
      en: 'From the renowned Huila region, this washed coffee delivers classic Colombian flavors. A perfect balance of sweetness and acidity with a smooth, chocolatey body.',
      de: 'Aus der renommierten Region Huila liefert dieser gewaschene Kaffee klassische kolumbianische Aromen. Eine perfekte Balance aus Süße und Säure mit einem weichen, schokoladigen Körper.',
    },
    basePrice: 1350,
    currency: 'EUR',
    variants: coffeeGrindVariants,
    badge: 'new',
    stockQuantity: 75,
    lowStockThreshold: 10,
    image: '/images/coffee/products/colombia-huila.png',
    attributes: {
      type: 'coffee',
      roastLevel: 'medium',
      process: 'washed',
      altitude: '1,500-1,800m',
      variety: 'Castillo, Caturra',
    } as CoffeeAttributes,
    averageRating: 4.7,
    reviewCount: 32,
  },
  {
    id: 'brazil-santos',
    slug: 'brazil-santos',
    brand: 'coffee',
    active: true,
    name: { en: 'Santos Natural', de: 'Santos Natural' },
    origin: { en: 'Brazil', de: 'Brasilien' },
    notes: { en: 'Nuts, dark chocolate, smooth body', de: 'Nüsse, dunkle Schokolade, vollmundig' },
    description: {
      en: 'A crowd-pleaser from the Santos region of Brazil. This natural processed coffee offers deep chocolate notes, nutty undertones, and a silky smooth body perfect for espresso.',
      de: 'Ein Publikumsliebling aus der Santos-Region Brasiliens. Dieser naturbelassene Kaffee bietet tiefe Schokoladennoten, nussige Untertöne und einen seidig-weichen Körper, perfekt für Espresso.',
    },
    basePrice: 1290,
    currency: 'EUR',
    variants: coffeeGrindVariants,
    stockQuantity: 120,
    lowStockThreshold: 15,
    image: '/images/coffee/products/brazil-santos.png',
    attributes: {
      type: 'coffee',
      roastLevel: 'medium-dark',
      process: 'natural',
      altitude: '800-1,200m',
      variety: 'Bourbon, Mundo Novo',
    } as CoffeeAttributes,
    averageRating: 4.6,
    reviewCount: 58,
  },
];

// Tea Products
export const teaProducts: Product[] = [
  {
    id: 'jade-dragon',
    slug: 'jade-dragon',
    brand: 'tea',
    active: true,
    name: { en: 'Jade Dragon', de: 'Jade Drache' },
    origin: { en: 'China, Zhejiang', de: 'China, Zhejiang' },
    notes: { en: 'Sweet, chestnut, vegetal freshness', de: 'Süß, Kastanie, pflanzliche Frische' },
    description: {
      en: 'A premium Long Jing (Dragon Well) green tea from Zhejiang province. Hand-picked and pan-fired using traditional methods, this tea offers a sweet, nutty character with refreshing vegetal notes.',
      de: 'Ein Premium Long Jing (Drachenbrunnentee) Grüntee aus der Provinz Zhejiang. Handgepflückt und traditionell in der Pfanne geröstet, bietet dieser Tee einen süßen, nussigen Charakter mit erfrischenden pflanzlichen Noten.',
    },
    basePrice: 1290,
    currency: 'EUR',
    variants: teaFormatVariants,
    badge: 'bestseller',
    stockQuantity: 80,
    lowStockThreshold: 10,
    image: '/images/tea/products/jade-dragon.png',
    attributes: {
      type: 'tea',
      teaType: 'green',
      caffeine: 'medium',
      steepTime: '2-3 min',
      temperature: '75°C',
    } as TeaAttributes,
    averageRating: 4.8,
    reviewCount: 34,
  },
  {
    id: 'earl-grey-supreme',
    slug: 'earl-grey-supreme',
    brand: 'tea',
    active: true,
    name: { en: 'Earl Grey Supreme', de: 'Earl Grey Supreme' },
    origin: { en: 'India & Sri Lanka Blend', de: 'Indien & Sri Lanka Mischung' },
    notes: { en: 'Bergamot, citrus, malty base', de: 'Bergamotte, Zitrus, malzige Basis' },
    description: {
      en: 'Our signature Earl Grey blend combines premium Ceylon and Assam teas with natural bergamot oil. A sophisticated classic with a citrusy brightness and rich, malty undertones.',
      de: 'Unsere Signature Earl Grey Mischung kombiniert Premium Ceylon und Assam Tees mit natürlichem Bergamotteöl. Ein raffinierter Klassiker mit zitrusartiger Frische und reichen, malzigen Untertönen.',
    },
    basePrice: 1190,
    currency: 'EUR',
    variants: teaFormatVariants,
    badge: 'new',
    stockQuantity: 90,
    lowStockThreshold: 10,
    image: '/images/tea/products/earl-grey-supreme.png',
    attributes: {
      type: 'tea',
      teaType: 'black',
      caffeine: 'high',
      steepTime: '3-5 min',
      temperature: '95°C',
    } as TeaAttributes,
    averageRating: 4.7,
    reviewCount: 28,
  },
  {
    id: 'alpine-herbs',
    slug: 'alpine-herbs',
    brand: 'tea',
    active: true,
    name: { en: 'Alpine Herbs', de: 'Alpenkräuter' },
    origin: { en: 'Bavaria, Germany', de: 'Bayern, Deutschland' },
    notes: { en: 'Mint, chamomile, lemon balm', de: 'Minze, Kamille, Zitronenmelisse' },
    description: {
      en: 'A soothing caffeine-free blend of alpine herbs sourced from family farms in Bavaria. Perfect for relaxation, this gentle infusion combines mint, chamomile, and lemon balm.',
      de: 'Eine beruhigende koffeinfreie Mischung aus Alpenkräutern von Familienbetrieben in Bayern. Perfekt zur Entspannung, kombiniert dieser sanfte Aufguss Minze, Kamille und Zitronenmelisse.',
    },
    basePrice: 990,
    currency: 'EUR',
    variants: teaFormatVariants,
    stockQuantity: 60,
    lowStockThreshold: 10,
    image: '/images/tea/products/alpine-herbs.png',
    attributes: {
      type: 'tea',
      teaType: 'herbal',
      caffeine: 'none',
      steepTime: '5-7 min',
      temperature: '100°C',
    } as TeaAttributes,
    averageRating: 4.9,
    reviewCount: 45,
  },
];

// All products combined
export const allProducts: Product[] = [...coffeeProducts, ...teaProducts];

// Helper functions
export function getProductsByBrand(brand: 'coffee' | 'tea'): Product[] {
  return allProducts.filter((p) => p.brand === brand && p.active);
}

export function getProductBySlug(slug: string): Product | undefined {
  return allProducts.find((p) => p.slug === slug && p.active);
}

export function getProductById(id: string): Product | undefined {
  return allProducts.find((p) => p.id === id);
}
