import styles from './dashboard.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardIndex() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Admin Dashboard</h1>
        <p>Overview and quick links</p>
      </header>

      <section className={styles.columns}>
        <div className={styles.section}>
          <h2>Analytics</h2>
          <p>View sales, revenue and referral metrics.</p>
        </div>
        <div className={styles.section}>
          <h2>Orders</h2>
          <p>View and manage recent orders.</p>
        </div>
        <div className={styles.section}>
          <h2>Customers</h2>
          <p>View customer list and account details.</p>
        </div>
        <div className={styles.section}>
          <h2>Referrals</h2>
          <p>Monitor referral activity and rewards.</p>
        </div>
      </section>
    </div>
  );
}
