import { redirect } from 'next/navigation';
import { getCurrentB2BCompany } from '@/lib/b2b-auth';
import { db } from '@/db';
import { b2bHolidayPeriods, smartBoxes } from '@/db/schema';
import { eq, gte, and } from 'drizzle-orm';
import styles from '../portal.module.css';
import { HolidayForm } from './HolidayForm';
import { HolidayList } from './HolidayList';

export const metadata = {
  title: 'Holiday Periods | B2B Portal',
  description: 'Manage holiday periods to pause automatic reordering',
};

export default async function HolidaysPage() {
  const company = await getCurrentB2BCompany();
  if (!company) {
    redirect('/b2b/login');
  }

  // Get company's SmartBoxes
  const boxes = await db.query.smartBoxes.findMany({
    where: eq(smartBoxes.companyId, company.id),
    orderBy: [smartBoxes.locationDescription],
  });

  // Get upcoming and current holiday periods
  const now = new Date();
  const holidays = await db.query.b2bHolidayPeriods.findMany({
    where: and(
      eq(b2bHolidayPeriods.companyId, company.id),
      gte(b2bHolidayPeriods.endDate, now)
    ),
    orderBy: [b2bHolidayPeriods.startDate],
  });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Holiday Periods</h1>
        <p className={styles.pageSubtitle}>
          Pause automatic reordering during office closures, holidays, or vacations
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>📅</span>
              <div>
                <h4>Schedule Holidays</h4>
                <p>Set dates when your office will be closed</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>⏸️</span>
              <div>
                <h4>Pause Reordering</h4>
                <p>Automatic orders are paused during these periods</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>🔄</span>
              <div>
                <h4>Auto-Resume</h4>
                <p>Reordering automatically resumes when you return</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.twoColumnGrid}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Add Holiday Period</h2>
          </div>
          <HolidayForm companyId={company.id} boxes={boxes} />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Upcoming & Current Holidays</h2>
          </div>
          <HolidayList holidays={holidays} boxes={boxes} />
        </div>
      </div>
    </div>
  );
}
