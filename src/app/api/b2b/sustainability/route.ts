import { NextResponse } from 'next/server';
import { getCurrentB2BCompany } from '@/lib/b2b-auth';
import { db } from '@/db';
import { b2bSustainabilityStats, b2bOrders, orders, orderItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const company = await getCurrentB2BCompany();

  if (!company) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get sustainability stats
    const stats = await db
      .select()
      .from(b2bSustainabilityStats)
      .where(eq(b2bSustainabilityStats.companyId, company.id))
      .limit(1);

    // If no stats exist, calculate from order history
    if (stats.length === 0) {
      const orderData = await db
        .select({
          quantity: orderItems.quantity,
          weight: orderItems.weight,
        })
        .from(b2bOrders)
        .innerJoin(orders, eq(b2bOrders.orderId, orders.id))
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(eq(b2bOrders.companyId, company.id));

      // Calculate totals
      let totalWeightGrams = 0;
      for (const item of orderData) {
        const weight = parseInt(item.weight?.replace('g', '') || '250');
        totalWeightGrams += weight * item.quantity;
      }

      const totalKg = totalWeightGrams / 1000;
      const estimatedCups = Math.round(totalKg * 100); // ~10g per cup

      return NextResponse.json({
        stats: {
          totalCoffeeKg: totalKg,
          totalTeaKg: 0,
          totalCupsServed: estimatedCups,
          farmerPremiumPaidCents: Math.round(totalKg * 200), // €2/kg premium
          recyclablePackagingCount: orderData.length,
        },
        impact: calculateImpact(totalKg, estimatedCups),
      });
    }

    return NextResponse.json({
      stats: stats[0],
      impact: calculateImpact(
        (stats[0].totalCoffeeKg || 0) + (stats[0].totalTeaKg || 0),
        stats[0].totalCupsServed || 0
      ),
    });
  } catch (error) {
    console.error('Failed to fetch sustainability stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sustainability stats' },
      { status: 500 }
    );
  }
}

function calculateImpact(totalKg: number, totalCups: number) {
  // Environmental impact calculations
  // Based on industry research and our sustainable practices

  // CO2 savings: Traditional retail ~15kg CO2/kg, our B2B direct ~8kg CO2/kg
  const co2SavingsKg = totalKg * 7;

  // Water: Traditional coffee ~140L/cup, direct trade ~100L/cup
  const waterSavingsLiters = totalCups * 40;

  // Packaging: B2B bulk reduces packaging by ~60% vs retail
  const packagingReductionGrams = totalKg * 120; // 200g retail vs 80g B2B per kg

  // Trees equivalent: 21kg CO2 absorbed per tree per year
  const treesEquivalent = Math.round(co2SavingsKg / 21);

  // Farmer premium: Our direct trade premium above market price
  const farmerPremiumEuros = totalKg * 2; // €2/kg premium

  return {
    co2SavingsKg: Math.round(co2SavingsKg * 10) / 10,
    waterSavingsLiters: Math.round(waterSavingsLiters),
    packagingReductionKg: Math.round(packagingReductionGrams / 100) / 10,
    treesEquivalent,
    farmerPremiumEuros: Math.round(farmerPremiumEuros * 100) / 100,
    carbonNeutralDeliveries: true,
    directTradeCertified: true,
    recyclablePackaging: true,
  };
}
