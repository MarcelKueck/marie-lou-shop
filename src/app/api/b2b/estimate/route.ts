import { NextResponse } from 'next/server';

/**
 * B2B Consumption Estimate API
 * GET /api/b2b/estimate
 * 
 * Provides estimated costs and consumption for B2B customers
 * based on employee count and selected tier
 */

// Pricing constants (in EUR)
const FLEX_PRICING = {
  pricePerKg: 24.99, // Average price per kg
  cupsPerKg: 100, // Approximate cups per kg of coffee
  avgMonthlyConsumption: 0.5, // kg per employee per month
};

const SMART_PRICING = {
  // Monthly rate per employee by tier
  starter: { min: 1, max: 15, rate: 15 },
  growth: { min: 16, max: 50, rate: 12 },
  scale: { min: 51, max: 200, rate: 10 },
  enterprise: { min: 201, max: Infinity, rate: 8 },
};

const SMART_BOX_COSTS = {
  small: { capacity: '1.4kg', depositEur: 49, included: 1 },
  medium: { capacity: '1.9kg', depositEur: 69, included: 2 },
  large: { capacity: '3.3kg', depositEur: 99, included: 0 },
};

interface EstimateRequest {
  employeeCount: number;
  tier?: 'flex' | 'smart';
  consumptionLevel?: 'low' | 'medium' | 'high'; // 0.3, 0.5, 0.8 kg/employee/month
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const employeeCount = parseInt(searchParams.get('employees') || '10', 10);
    const tier = (searchParams.get('tier') || 'flex') as 'flex' | 'smart';
    const consumptionLevel = (searchParams.get('consumption') || 'medium') as 'low' | 'medium' | 'high';
    
    if (employeeCount < 1 || employeeCount > 10000) {
      return NextResponse.json(
        { error: 'Employee count must be between 1 and 10000' },
        { status: 400 }
      );
    }
    
    const consumptionMultiplier = {
      low: 0.3,
      medium: 0.5,
      high: 0.8,
    }[consumptionLevel];
    
    const monthlyKg = employeeCount * consumptionMultiplier;
    const cupsPerMonth = Math.round(monthlyKg * FLEX_PRICING.cupsPerKg);
    
    if (tier === 'flex') {
      // Calculate Flex pricing
      const monthlyProductCost = monthlyKg * FLEX_PRICING.pricePerKg;
      
      // Volume discount tiers
      let discountPercent = 0;
      let discountTier = 'none';
      if (monthlyKg >= 50) {
        discountPercent = 15;
        discountTier = '50kg+';
      } else if (monthlyKg >= 25) {
        discountPercent = 10;
        discountTier = '25kg+';
      } else if (monthlyKg >= 10) {
        discountPercent = 5;
        discountTier = '10kg+';
      } else if (monthlyKg >= 5) {
        discountPercent = 3;
        discountTier = '5kg+';
      }
      
      const discountAmount = monthlyProductCost * (discountPercent / 100);
      const finalMonthlyAmount = monthlyProductCost - discountAmount;
      
      return NextResponse.json({
        tier: 'flex',
        employeeCount,
        consumption: {
          level: consumptionLevel,
          monthlyKg: Math.round(monthlyKg * 10) / 10,
          monthlyUnits: cupsPerMonth,
        },
        pricing: {
          baseMonthly: Math.round(monthlyProductCost * 100) / 100,
          discountTier,
          discountPercent,
          discountAmount: Math.round(discountAmount * 100) / 100,
          finalMonthly: Math.round(finalMonthlyAmount * 100) / 100,
          perEmployee: Math.round((finalMonthlyAmount / employeeCount) * 100) / 100,
          perCup: Math.round((finalMonthlyAmount / cupsPerMonth) * 100) / 100,
        },
        features: [
          'On-demand ordering',
          'Invoice payment (Net 14-30)',
          'Volume discounts',
          'Employee promo codes',
          'No minimum commitment',
        ],
        recommendation: monthlyKg >= 10 
          ? 'Consider switching to Smart tier for automated ordering and better per-employee rates'
          : 'Flex tier is ideal for your company size',
      });
    }
    
    // Calculate Smart pricing
    let smartTier: 'starter' | 'growth' | 'scale' | 'enterprise';
    let ratePerEmployee: number;
    
    if (employeeCount <= SMART_PRICING.starter.max) {
      smartTier = 'starter';
      ratePerEmployee = SMART_PRICING.starter.rate;
    } else if (employeeCount <= SMART_PRICING.growth.max) {
      smartTier = 'growth';
      ratePerEmployee = SMART_PRICING.growth.rate;
    } else if (employeeCount <= SMART_PRICING.scale.max) {
      smartTier = 'scale';
      ratePerEmployee = SMART_PRICING.scale.rate;
    } else {
      smartTier = 'enterprise';
      ratePerEmployee = SMART_PRICING.enterprise.rate;
    }
    
    const monthlySubscription = employeeCount * ratePerEmployee;
    
    // SmartBox calculation
    const boxesNeeded = Math.ceil(employeeCount / 25); // 1 box per 25 employees
    const includedBoxes = smartTier === 'starter' ? 1 : smartTier === 'growth' ? 2 : 3;
    const extraBoxes = Math.max(0, boxesNeeded - includedBoxes);
    const boxDeposit = extraBoxes * SMART_BOX_COSTS.medium.depositEur;
    
    // Compare to Flex pricing
    const flexEquivalent = monthlyKg * FLEX_PRICING.pricePerKg;
    const savings = flexEquivalent - monthlySubscription;
    const savingsPercent = Math.round((savings / flexEquivalent) * 100);
    
    return NextResponse.json({
      tier: 'smart',
      smartTier,
      employeeCount,
      consumption: {
        level: consumptionLevel,
        monthlyKg: Math.round(monthlyKg * 10) / 10,
        monthlyUnits: cupsPerMonth,
        unlimited: true,
      },
      pricing: {
        ratePerEmployee,
        monthlySubscription,
        perCup: Math.round((monthlySubscription / cupsPerMonth) * 100) / 100,
        comparedToFlex: {
          flexCost: Math.round(flexEquivalent * 100) / 100,
          savings: Math.round(savings * 100) / 100,
          savingsPercent: Math.max(0, savingsPercent),
        },
      },
      smartBoxes: {
        recommended: boxesNeeded,
        included: includedBoxes,
        extra: extraBoxes,
        depositIfExtra: boxDeposit,
      },
      features: [
        'Unlimited coffee supply',
        'SmartBox auto-reorder',
        'Real-time inventory',
        'Dedicated account manager',
        'Priority support',
        'Consumption analytics',
        'Employee promo codes (15% off)',
      ],
      recommendation: savings > 0
        ? `Smart tier saves you €${Math.round(savings)} per month compared to Flex`
        : 'Smart tier provides predictable costs and premium features',
    });
  } catch (error) {
    console.error('B2B estimate error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate estimate' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as EstimateRequest;
    
    // Convert POST body to query params for GET handler
    const url = new URL(request.url);
    url.searchParams.set('employees', String(body.employeeCount));
    if (body.tier) url.searchParams.set('tier', body.tier);
    if (body.consumptionLevel) url.searchParams.set('consumption', body.consumptionLevel);
    
    const modifiedRequest = new Request(url.toString(), {
      method: 'GET',
      headers: request.headers,
    });
    
    return GET(modifiedRequest);
  } catch (error) {
    console.error('B2B estimate POST error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
