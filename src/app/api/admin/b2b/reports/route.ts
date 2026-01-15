import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { b2bCompanies, b2bOrders, orders, smartBoxes, b2bPromoUsage } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';

/**
 * B2B Reports API
 * GET /api/admin/b2b/reports
 * 
 * Provides comprehensive B2B analytics and reporting data
 */

export async function GET(request: NextRequest) {
  // Verify admin authentication
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '12m':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }
    
    // Fetch all companies
    const allCompanies = await db.select().from(b2bCompanies);
    
    // Overview metrics
    const totalCompanies = allCompanies.length;
    const activeCompanies = allCompanies.filter(c => c.status === 'active').length;
    const flexCompanies = allCompanies.filter(c => c.tier === 'flex').length;
    const smartCompanies = allCompanies.filter(c => c.tier.startsWith('smart')).length;
    const totalEmployees = allCompanies
      .filter(c => c.tier.startsWith('smart'))
      .reduce((sum, c) => sum + (c.employeeCount || 0), 0);
    
    // Revenue calculation - get all B2B orders with their order totals
    const b2bOrdersWithTotals = await db
      .select({
        companyId: b2bOrders.companyId,
        orderId: b2bOrders.orderId,
        orderTotal: orders.total,
        createdAt: b2bOrders.createdAt,
      })
      .from(b2bOrders)
      .innerJoin(orders, eq(b2bOrders.orderId, orders.id));
    
    const totalRevenue = b2bOrdersWithTotals.reduce((sum, o) => sum + (o.orderTotal || 0), 0);
    
    const periodOrders = b2bOrdersWithTotals.filter(o => o.createdAt >= startDate);
    const monthlyRevenue = periodOrders.reduce((sum, o) => sum + (o.orderTotal || 0), 0);
    
    // Revenue by tier
    const revenueByTier = await calculateRevenueByTier(allCompanies, b2bOrdersWithTotals);
    
    // Top companies by revenue
    const companyRevenueMap = new Map<string, { total: number; count: number; lastOrder: Date | null }>();
    for (const order of b2bOrdersWithTotals) {
      const existing = companyRevenueMap.get(order.companyId) || { total: 0, count: 0, lastOrder: null };
      existing.total += order.orderTotal || 0;
      existing.count += 1;
      if (!existing.lastOrder || (order.createdAt && order.createdAt > existing.lastOrder)) {
        existing.lastOrder = order.createdAt;
      }
      companyRevenueMap.set(order.companyId, existing);
    }
    
    const topCompanies = allCompanies
      .map(company => {
        const stats = companyRevenueMap.get(company.id) || { total: 0, count: 0, lastOrder: null };
        return {
          id: company.id,
          name: company.companyName,
          tier: company.tier,
          totalSpent: stats.total,
          orderCount: stats.count,
          lastOrder: stats.lastOrder?.toISOString() || null,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
    
    // SmartBox metrics
    const allBoxes = await db.select().from(smartBoxes);
    const activeBoxes = allBoxes.filter(b => b.status === 'active');
    const avgFillPercent = activeBoxes.length > 0
      ? activeBoxes.reduce((sum, b) => sum + (b.currentFillPercent || 0), 0) / activeBoxes.length
      : 0;
    
    // Promo usage stats
    const allPromoUsage = await db.select().from(b2bPromoUsage);
    const periodPromoUsage = allPromoUsage.filter(p => p.createdAt >= startDate);
    const uniqueEmails = new Set(periodPromoUsage.map(p => p.customerEmail));
    const totalDiscountGiven = periodPromoUsage.reduce((sum, p) => sum + (p.discountAmount || 0), 0);
    
    // Monthly trend (last 6 months)
    const monthlyTrend = calculateMonthlyTrend(b2bOrdersWithTotals, allCompanies);
    
    return NextResponse.json({
      overview: {
        totalCompanies,
        activeCompanies,
        totalRevenue,
        monthlyRevenue,
        flexCompanies,
        smartCompanies,
        totalEmployees,
      },
      revenueByTier,
      topCompanies,
      monthlyTrend,
      smartBoxMetrics: {
        totalBoxes: allBoxes.length,
        activeBoxes: activeBoxes.length,
        avgFillPercent: Math.round(avgFillPercent),
        alertsThisMonth: 0, // Would need alert tracking table
        autoReorders: 0, // Would need to track auto-reorders
      },
      promoUsage: {
        totalUsages: periodPromoUsage.length,
        uniqueCustomers: uniqueEmails.size,
        totalDiscountGiven,
        conversions: periodPromoUsage.filter(p => p.orderId).length,
      },
      generatedAt: now.toISOString(),
      range,
    });
  } catch (error) {
    console.error('B2B reports error:', error);
    return NextResponse.json(
      { error: 'Failed to generate reports' },
      { status: 500 }
    );
  }
}

interface OrderWithTotal {
  companyId: string;
  orderId: string | null;
  orderTotal: number;
  createdAt: Date;
}

interface Company {
  id: string;
  tier: string;
  createdAt: Date;
}

function calculateRevenueByTier(
  companies: Company[],
  orders: OrderWithTotal[]
) {
  const tierMap = new Map<string, { revenue: number; companies: Set<string> }>();
  
  // Initialize tiers
  const tiers = ['flex', 'smart_starter', 'smart_growth', 'smart_scale', 'smart_enterprise'];
  for (const tier of tiers) {
    tierMap.set(tier, { revenue: 0, companies: new Set() });
  }
  
  // Map company to tier
  const companyTierMap = new Map<string, string>();
  for (const company of companies) {
    companyTierMap.set(company.id, company.tier);
    const tierData = tierMap.get(company.tier);
    if (tierData) {
      tierData.companies.add(company.id);
    }
  }
  
  // Calculate revenue
  for (const order of orders) {
    const tier = companyTierMap.get(order.companyId);
    if (tier) {
      const tierData = tierMap.get(tier);
      if (tierData) {
        tierData.revenue += order.orderTotal || 0;
      }
    }
  }
  
  // Calculate totals for percentages
  let totalRevenue = 0;
  for (const [, data] of tierMap) {
    totalRevenue += data.revenue;
  }
  
  // Build result
  return Array.from(tierMap.entries())
    .filter(([, data]) => data.companies.size > 0 || data.revenue > 0)
    .map(([tier, data]) => ({
      tier,
      revenue: data.revenue,
      companies: data.companies.size,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

function calculateMonthlyTrend(
  orders: OrderWithTotal[],
  companies: Company[]
) {
  const monthMap = new Map<string, { revenue: number; orders: number; newCompanies: number }>();
  
  // Get last 6 months
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push(monthKey);
    monthMap.set(monthKey, { revenue: 0, orders: 0, newCompanies: 0 });
  }
  
  // Calculate order stats
  for (const order of orders) {
    if (!order.createdAt) continue;
    const monthKey = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
    const data = monthMap.get(monthKey);
    if (data) {
      data.revenue += order.orderTotal || 0;
      data.orders += 1;
    }
  }
  
  // Calculate new companies
  for (const company of companies) {
    if (!company.createdAt) continue;
    const monthKey = `${company.createdAt.getFullYear()}-${String(company.createdAt.getMonth() + 1).padStart(2, '0')}`;
    const data = monthMap.get(monthKey);
    if (data) {
      data.newCompanies += 1;
    }
  }
  
  // Build result
  return months.map(month => {
    const data = monthMap.get(month) || { revenue: 0, orders: 0, newCompanies: 0 };
    const [year, monthNum] = month.split('-');
    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return {
      month: monthName,
      ...data,
    };
  });
}
