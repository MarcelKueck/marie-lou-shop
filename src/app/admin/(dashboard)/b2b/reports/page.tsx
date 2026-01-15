'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../../dashboard.module.css';

interface B2BReportData {
  overview: {
    totalCompanies: number;
    activeCompanies: number;
    totalRevenue: number;
    monthlyRevenue: number;
    flexCompanies: number;
    smartCompanies: number;
    totalEmployees: number;
  };
  revenueByTier: {
    tier: string;
    revenue: number;
    companies: number;
    percentage: number;
  }[];
  topCompanies: {
    id: string;
    name: string;
    tier: string;
    totalSpent: number;
    orderCount: number;
    lastOrder: string | null;
  }[];
  monthlyTrend: {
    month: string;
    revenue: number;
    orders: number;
    newCompanies: number;
  }[];
  smartBoxMetrics: {
    totalBoxes: number;
    activeBoxes: number;
    avgFillPercent: number;
    alertsThisMonth: number;
    autoReorders: number;
  };
  promoUsage: {
    totalUsages: number;
    uniqueCustomers: number;
    totalDiscountGiven: number;
    conversions: number;
  };
}

export default function AdminB2BReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<B2BReportData | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [exportLoading, setExportLoading] = useState(false);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/b2b/reports?range=${dateRange}`);
      if (!res.ok) throw new Error('Failed to fetch report data');
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading reports');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExportLoading(true);
    try {
      const res = await fetch(`/api/admin/b2b/reports/export?range=${dateRange}&format=${format}`);
      if (!res.ok) throw new Error('Failed to export report');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `b2b-report-${dateRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error exporting report');
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const formatPercent = (value: number) => {
    return `${Math.round(value)}%`;
  };

  if (loading && !reportData) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>B2B Reports</h1>
        <div className={styles.loading}>Loading reports...</div>
      </div>
    );
  }

  if (error && !reportData) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>B2B Reports</h1>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>B2B Reports & Analytics</h1>
        <div className={styles.headerActions}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={styles.select}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={() => handleExport('csv')}
            className={styles.buttonSecondary}
            disabled={exportLoading}
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className={styles.buttonPrimary}
            disabled={exportLoading}
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total B2B Revenue</div>
          <div className={styles.statValue}>
            {formatCurrency(reportData?.overview.totalRevenue || 0)}
          </div>
          <div className={styles.statChange}>
            This period: {formatCurrency(reportData?.overview.monthlyRevenue || 0)}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active Companies</div>
          <div className={styles.statValue}>
            {reportData?.overview.activeCompanies || 0}
          </div>
          <div className={styles.statChange}>
            of {reportData?.overview.totalCompanies || 0} total
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Employees</div>
          <div className={styles.statValue}>
            {reportData?.overview.totalEmployees || 0}
          </div>
          <div className={styles.statChange}>
            Across all Smart tier companies
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Tier Distribution</div>
          <div className={styles.statValue}>
            {reportData?.overview.smartCompanies || 0} Smart / {reportData?.overview.flexCompanies || 0} Flex
          </div>
        </div>
      </div>

      {/* Revenue by Tier */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Revenue by Tier</h2>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Tier</th>
                <th>Companies</th>
                <th>Revenue</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {reportData?.revenueByTier.map((tier) => (
                <tr key={tier.tier}>
                  <td>
                    <span className={`${styles.badge} ${tier.tier.startsWith('smart') ? styles.badgeSuccess : styles.badgeInfo}`}>
                      {tier.tier}
                    </span>
                  </td>
                  <td>{tier.companies}</td>
                  <td>{formatCurrency(tier.revenue)}</td>
                  <td>{formatPercent(tier.percentage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Companies */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Companies by Revenue</h2>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Tier</th>
                <th>Total Spent</th>
                <th>Orders</th>
                <th>Last Order</th>
              </tr>
            </thead>
            <tbody>
              {reportData?.topCompanies.map((company) => (
                <tr key={company.id}>
                  <td>{company.name}</td>
                  <td>
                    <span className={`${styles.badge} ${company.tier.startsWith('smart') ? styles.badgeSuccess : styles.badgeInfo}`}>
                      {company.tier}
                    </span>
                  </td>
                  <td>{formatCurrency(company.totalSpent)}</td>
                  <td>{company.orderCount}</td>
                  <td>
                    {company.lastOrder
                      ? new Date(company.lastOrder).toLocaleDateString('de-DE')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SmartBox Metrics */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>SmartBox Metrics</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active SmartBoxes</div>
            <div className={styles.statValue}>
              {reportData?.smartBoxMetrics.activeBoxes || 0}
            </div>
            <div className={styles.statChange}>
              of {reportData?.smartBoxMetrics.totalBoxes || 0} total
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Avg Fill Level</div>
            <div className={styles.statValue}>
              {formatPercent(reportData?.smartBoxMetrics.avgFillPercent || 0)}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Alerts This Month</div>
            <div className={styles.statValue}>
              {reportData?.smartBoxMetrics.alertsThisMonth || 0}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Auto-Reorders</div>
            <div className={styles.statValue}>
              {reportData?.smartBoxMetrics.autoReorders || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Promo Code Usage */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Employee Promo Code Usage</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Usages</div>
            <div className={styles.statValue}>
              {reportData?.promoUsage.totalUsages || 0}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Unique Customers</div>
            <div className={styles.statValue}>
              {reportData?.promoUsage.uniqueCustomers || 0}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Discount Given</div>
            <div className={styles.statValue}>
              {formatCurrency(reportData?.promoUsage.totalDiscountGiven || 0)}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Conversions</div>
            <div className={styles.statValue}>
              {reportData?.promoUsage.conversions || 0}
            </div>
            <div className={styles.statChange}>
              D2C orders from B2B promos
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Monthly Trend</h2>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>Orders</th>
                <th>New Companies</th>
              </tr>
            </thead>
            <tbody>
              {reportData?.monthlyTrend.map((month) => (
                <tr key={month.month}>
                  <td>{month.month}</td>
                  <td>{formatCurrency(month.revenue)}</td>
                  <td>{month.orders}</td>
                  <td>{month.newCompanies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
