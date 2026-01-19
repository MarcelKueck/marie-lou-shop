'use client';

import { useMemo } from 'react';
import styles from '../portal.module.css';

interface BoxReading {
  id: string;
  boxId: string;
  weightGrams: number | null;
  recordedAt: Date;
}

interface SmartBox {
  id: string;
  locationDescription: string | null;
  deviceId: string;
}

interface ConsumptionChartProps {
  readings: BoxReading[];
  boxes: SmartBox[];
}

// Group readings by date and calculate daily totals
function processReadingsForChart(readings: BoxReading[]) {
  const dailyData: Record<string, { date: string; totalWeight: number; readingCount: number }> = {};
  
  readings.forEach((reading) => {
    const dateStr = new Date(reading.recordedAt).toISOString().split('T')[0];
    
    if (!dailyData[dateStr]) {
      dailyData[dateStr] = {
        date: dateStr,
        totalWeight: 0,
        readingCount: 0,
      };
    }
    
    if (reading.weightGrams) {
      dailyData[dateStr].totalWeight += reading.weightGrams;
      dailyData[dateStr].readingCount++;
    }
  });
  
  // Convert to array and sort by date
  return Object.values(dailyData)
    .map((day) => ({
      date: day.date,
      avgWeight: day.readingCount > 0 ? Math.round(day.totalWeight / day.readingCount) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Calculate consumption (weight decreases) between consecutive readings
function calculateDailyConsumption(data: { date: string; avgWeight: number }[]) {
  const consumption: { date: string; consumption: number }[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    
    // Consumption is when weight decreases
    // Ignore increases (restock events)
    const diff = prev.avgWeight - curr.avgWeight;
    consumption.push({
      date: curr.date,
      consumption: diff > 0 ? diff : 0,
    });
  }
  
  return consumption;
}

export function ConsumptionChart({ readings }: ConsumptionChartProps) {
  const chartData = useMemo(() => {
    const processedData = processReadingsForChart(readings);
    return calculateDailyConsumption(processedData);
  }, [readings]);

  if (chartData.length === 0) {
    return (
      <div className={styles.emptyChart}>
        <p>Not enough data to display consumption trends yet.</p>
        <p className={styles.emptyHint}>Check back after a few days of readings.</p>
      </div>
    );
  }

  // Find max for scaling
  const maxConsumption = Math.max(...chartData.map((d) => d.consumption), 100);
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartWrapper}>
        <div className={styles.chartBars}>
          {chartData.slice(-14).map((day) => {
            const heightPercent = (day.consumption / maxConsumption) * 100;
            return (
              <div key={day.date} className={styles.chartBarColumn}>
                <div className={styles.chartBarWrapper}>
                  <div
                    className={styles.chartBar}
                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                    title={`${day.consumption}g consumed on ${formatDate(day.date)}`}
                  />
                </div>
                <span className={styles.chartLabel}>
                  {formatDate(day.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className={styles.chartLegend}>
        <p className={styles.chartNote}>
          📊 Daily consumption (grams) - Last 14 days
        </p>
        <p className={styles.chartHint}>
          Tip: Spikes may indicate restocking days or unusual consumption patterns
        </p>
      </div>
    </div>
  );
}
