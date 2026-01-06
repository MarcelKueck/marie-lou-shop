import { LocalizedString } from './products/types';

export interface ShippingMethod {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number; // cents
  freeAbove?: number; // Free shipping threshold (cents)
  estimatedDays: { min: number; max: number };
  stripeShippingRateId?: string;
}

export interface ShippingZone {
  id: string;
  name: LocalizedString;
  countries: string[]; // ISO codes
  methods: ShippingMethod[];
}

export const shippingZones: ShippingZone[] = [
  {
    id: 'germany',
    name: { en: 'Germany', de: 'Deutschland' },
    countries: ['DE'],
    methods: [
      {
        id: 'standard-de',
        name: { en: 'Standard Shipping', de: 'Standardversand' },
        description: { en: 'DHL Paket', de: 'DHL Paket' },
        price: 495,
        freeAbove: 4900,
        estimatedDays: { min: 2, max: 4 },
      },
      {
        id: 'express-de',
        name: { en: 'Express Shipping', de: 'Expressversand' },
        description: {
          en: 'DHL Express (next business day)',
          de: 'DHL Express (nächster Werktag)',
        },
        price: 995,
        estimatedDays: { min: 1, max: 1 },
      },
    ],
  },
  {
    id: 'eu',
    name: { en: 'European Union', de: 'Europäische Union' },
    countries: ['AT', 'NL', 'BE', 'FR', 'IT', 'ES', 'PL', 'CZ', 'DK', 'SE'],
    methods: [
      {
        id: 'standard-eu',
        name: { en: 'EU Shipping', de: 'EU-Versand' },
        description: { en: 'DHL Paket International', de: 'DHL Paket International' },
        price: 995,
        freeAbove: 7500,
        estimatedDays: { min: 3, max: 7 },
      },
    ],
  },
  {
    id: 'ch',
    name: { en: 'Switzerland', de: 'Schweiz' },
    countries: ['CH'],
    methods: [
      {
        id: 'standard-ch',
        name: { en: 'Switzerland Shipping', de: 'Schweiz Versand' },
        description: {
          en: 'DHL Paket (customs may apply)',
          de: 'DHL Paket (Zoll kann anfallen)',
        },
        price: 1495,
        estimatedDays: { min: 4, max: 8 },
      },
    ],
  },
];

export function getShippingZoneByCountry(countryCode: string): ShippingZone | undefined {
  return shippingZones.find((zone) => zone.countries.includes(countryCode));
}

export function getDefaultShippingZone(): ShippingZone {
  return shippingZones.find((zone) => zone.id === 'germany') || shippingZones[0];
}

export function calculateShippingCost(
  countryCode: string,
  methodId: string,
  subtotal: number
): number {
  const zone = getShippingZoneByCountry(countryCode);
  if (!zone) return 0;

  const method = zone.methods.find((m) => m.id === methodId);
  if (!method) return 0;

  // Check for free shipping
  if (method.freeAbove && subtotal >= method.freeAbove) {
    return 0;
  }

  return method.price;
}
