import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Settings</h1>
        <p>Store and application settings (placeholder)</p>
      </header>

      <section className={styles.section}>
        <p>This page will hold store-wide settings like shipping, tax, and integrations.</p>
      </section>
    </div>
  );
}
