import { getCurrentB2BCompany } from '@/lib/b2b-auth';
import { db } from '@/db';
import { b2bOrders, orders, orderItems, products, smartBoxes, boxReadings } from '@/db/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import Link from 'next/link';
import styles from './sustainability.module.css';

export default async function SustainabilityPage() {
  const company = await getCurrentB2BCompany();
  
  if (!company) {
    return null;
  }
  
  // Get date ranges
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  // Get all company orders with items
  const companyOrders = await db
    .select({
      orderId: orders.id,
      createdAt: orders.createdAt,
      productId: orderItems.productId,
      productName: products.nameEn,
      quantity: orderItems.quantity,
    })
    .from(b2bOrders)
    .innerJoin(orders, eq(b2bOrders.orderId, orders.id))
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(b2bOrders.companyId, company.id))
    .orderBy(desc(orders.createdAt));
  
  // Calculate statistics
  const totalOrders = new Set(companyOrders.map(o => o.orderId)).size;
  const totalProducts = companyOrders.reduce((sum, o) => sum + o.quantity, 0);
  
  // Calculate weight (assuming 250g per product unit - standard coffee/tea package)
  const totalWeightGrams = companyOrders.reduce((sum, o) => {
    return sum + (250 * o.quantity);
  }, 0);
  const totalWeightKg = totalWeightGrams / 1000;
  
  // Orders in last 30 days
  const recentOrders = companyOrders.filter(
    o => new Date(o.createdAt!) >= thirtyDaysAgo
  );
  const ordersLast30Days = new Set(recentOrders.map(o => o.orderId)).size;
  
  // Calculate sustainability metrics
  // Assumptions for CO2 calculations:
  // - Traditional retail coffee: ~15kg CO2 per kg (including packaging, transport, retail)
  // - Direct B2B coffee: ~8kg CO2 per kg (reduced packaging, direct delivery)
  // - SmartBox adds ~10% efficiency through waste reduction
  
  const co2PerKgRetail = 15;
  const co2PerKgB2B = company.tier === 'smart' ? 7.2 : 8; // SmartBox is more efficient
  const co2Savings = (co2PerKgRetail - co2PerKgB2B) * totalWeightKg;
  
  // Water savings (coffee production)
  // Traditional: ~140L per cup, Direct trade: ~100L per cup
  // Assuming ~15g per cup, so per kg = 66 cups
  const cupsPerKg = 66;
  const waterSavingsPerKg = (140 - 100) * cupsPerKg; // 2640L per kg
  const totalWaterSavings = waterSavingsPerKg * totalWeightKg;
  
  // Packaging reduction
  // Traditional: ~50g packaging per 250g product
  // B2B bulk: ~20g packaging per 250g product
  const packagingReductionPerProduct = 30; // grams
  const totalPackagingReduction = packagingReductionPerProduct * totalProducts;
  
  // Get SmartBox data for Smart tier
  let smartBoxStats = null;
  if (company.tier === 'smart') {
    const boxes = await db
      .select()
      .from(smartBoxes)
      .where(eq(smartBoxes.companyId, company.id));
    
    if (boxes.length > 0) {
      const boxIds = boxes.map(b => b.id);
      const readings = await db
        .select({
          boxId: boxReadings.boxId,
          fillPercent: boxReadings.fillPercent,
          recordedAt: boxReadings.recordedAt,
        })
        .from(boxReadings)
        .where(
          and(
            sql`${boxReadings.boxId} IN ${boxIds}`,
            gte(boxReadings.recordedAt, ninetyDaysAgo)
          )
        )
        .orderBy(desc(boxReadings.recordedAt));
      
      // Calculate waste prevention (orders triggered before running out)
      const timesNearEmpty = readings.filter(r => (r.fillPercent ?? 0) <= 20).length;
      const wastePreventedKg = timesNearEmpty * 0.5; // Estimated 0.5kg prevented per timely reorder
      
      smartBoxStats = {
        totalBoxes: boxes.length,
        activeBoxes: boxes.filter(b => b.status === 'active').length,
        totalReadings: readings.length,
        wastePreventedKg,
      };
    }
  }
  
  // Monthly breakdown
  const monthlyData: { month: string; orders: number; products: number; weightKg: number }[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthOrders = companyOrders.filter(o => {
      const orderDate = new Date(o.createdAt!);
      return orderDate >= monthStart && orderDate <= monthEnd;
    });
    
    monthlyData.push({
      month: monthNames[monthStart.getMonth()],
      orders: new Set(monthOrders.map(o => o.orderId)).size,
      products: monthOrders.reduce((sum, o) => sum + o.quantity, 0),
      weightKg: monthOrders.reduce((sum, o) => {
        return sum + (250 * o.quantity);
      }, 0) / 1000,
    });
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Sustainability Dashboard</h1>
        <p>Track your environmental impact with Marie Lou Coffee</p>
      </div>
      
      {/* Impact Summary */}
      <div className={styles.impactSummary}>
        <h2>🌍 Your Environmental Impact</h2>
        <div className={styles.impactGrid}>
          <div className={styles.impactCard}>
            <div className={styles.impactIcon}>🌱</div>
            <div className={styles.impactValue}>{co2Savings.toFixed(1)} kg</div>
            <div className={styles.impactLabel}>CO₂ Emissions Saved</div>
            <div className={styles.impactDetail}>vs. traditional retail supply chain</div>
          </div>
          
          <div className={styles.impactCard}>
            <div className={styles.impactIcon}>💧</div>
            <div className={styles.impactValue}>{(totalWaterSavings / 1000).toFixed(1)}k L</div>
            <div className={styles.impactLabel}>Water Footprint Reduced</div>
            <div className={styles.impactDetail}>through direct trade sourcing</div>
          </div>
          
          <div className={styles.impactCard}>
            <div className={styles.impactIcon}>📦</div>
            <div className={styles.impactValue}>{(totalPackagingReduction / 1000).toFixed(2)} kg</div>
            <div className={styles.impactLabel}>Packaging Reduced</div>
            <div className={styles.impactDetail}>through bulk B2B packaging</div>
          </div>
          
          <div className={styles.impactCard}>
            <div className={styles.impactIcon}>🌿</div>
            <div className={styles.impactValue}>{Math.round(co2Savings / 21)}</div>
            <div className={styles.impactLabel}>Trees Equivalent</div>
            <div className={styles.impactDetail}>annual CO₂ absorption</div>
          </div>
        </div>
      </div>
      
      {/* SmartBox Impact (for Smart tier) */}
      {smartBoxStats && (
        <div className={styles.smartBoxSection}>
          <h2>🎯 SmartBox Efficiency</h2>
          <div className={styles.smartBoxGrid}>
            <div className={styles.smartBoxCard}>
              <div className={styles.smartBoxValue}>{smartBoxStats.activeBoxes}</div>
              <div className={styles.smartBoxLabel}>Active SmartBoxes</div>
            </div>
            <div className={styles.smartBoxCard}>
              <div className={styles.smartBoxValue}>{smartBoxStats.totalReadings}</div>
              <div className={styles.smartBoxLabel}>Readings (90 days)</div>
            </div>
            <div className={styles.smartBoxCard}>
              <div className={styles.smartBoxValue}>{smartBoxStats.wastePreventedKg.toFixed(1)} kg</div>
              <div className={styles.smartBoxLabel}>Waste Prevented</div>
            </div>
            <div className={styles.smartBoxCard}>
              <div className={styles.smartBoxValue}>~15%</div>
              <div className={styles.smartBoxLabel}>Efficiency Gain</div>
            </div>
          </div>
          <p className={styles.smartBoxNote}>
            SmartBox auto-replenishment prevents stockouts and reduces waste by ordering just in time.
          </p>
        </div>
      )}
      
      {/* Order Statistics */}
      <div className={styles.statsSection}>
        <h2>📊 Order Statistics</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalOrders}</div>
            <div className={styles.statLabel}>Total Orders</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalProducts}</div>
            <div className={styles.statLabel}>Products Ordered</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalWeightKg.toFixed(1)} kg</div>
            <div className={styles.statLabel}>Total Weight</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{ordersLast30Days}</div>
            <div className={styles.statLabel}>Orders (30 days)</div>
          </div>
        </div>
      </div>
      
      {/* Monthly Trend */}
      <div className={styles.trendSection}>
        <h2>📈 Monthly Trend</h2>
        <div className={styles.trendChart}>
          {monthlyData.map((month, index) => (
            <div key={index} className={styles.trendBar}>
              <div 
                className={styles.bar}
                style={{ 
                  height: `${Math.max(10, (month.weightKg / Math.max(...monthlyData.map(m => m.weightKg || 1))) * 100)}%` 
                }}
              >
                <span className={styles.barValue}>{month.weightKg.toFixed(1)}</span>
              </div>
              <span className={styles.barLabel}>{month.month}</span>
            </div>
          ))}
        </div>
        <p className={styles.trendNote}>Monthly consumption in kg</p>
      </div>
      
      {/* Sustainability Certifications */}
      <div className={styles.certificationsSection}>
        <h2>🏆 Our Commitments</h2>
        <div className={styles.certGrid}>
          <div className={styles.certCard}>
            <div className={styles.certIcon}>🌱</div>
            <h3>Direct Trade</h3>
            <p>We work directly with farmers, ensuring fair prices and sustainable practices.</p>
          </div>
          <div className={styles.certCard}>
            <div className={styles.certIcon}>♻️</div>
            <h3>Eco Packaging</h3>
            <p>All our B2B packaging is recyclable or compostable.</p>
          </div>
          <div className={styles.certCard}>
            <div className={styles.certIcon}>🚚</div>
            <h3>Carbon Neutral Delivery</h3>
            <p>We offset all delivery emissions through verified carbon credits.</p>
          </div>
          <div className={styles.certCard}>
            <div className={styles.certIcon}>☕</div>
            <h3>Shade Grown</h3>
            <p>Our coffee is grown under forest canopy, preserving biodiversity.</p>
          </div>
        </div>
      </div>
      
      {/* Download Report */}
      <div className={styles.reportSection}>
        <h2>📄 Sustainability Report</h2>
        <p>Download your sustainability report to share with stakeholders or for your own records.</p>
        <div className={styles.reportButtons}>
          <button className={styles.reportButton} disabled>
            Download PDF Report (Coming Soon)
          </button>
          <button className={styles.reportButton} disabled>
            Download CSV Data (Coming Soon)
          </button>
        </div>
      </div>
      
      {/* Upgrade CTA for Flex tier */}
      {company.tier === 'flex' && (
        <div className={styles.upgradeCta}>
          <h2>🚀 Maximize Your Impact with SmartBox</h2>
          <p>
            Upgrade to B2B Smart to reduce waste by up to 15% with automatic inventory management.
            SmartBox ensures you never run out while minimizing overstock.
          </p>
          <Link href="/b2b/portal/account" className={styles.upgradeButton}>
            Request Upgrade
          </Link>
        </div>
      )}
    </div>
  );
}
