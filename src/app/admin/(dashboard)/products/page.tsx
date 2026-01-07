import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Products</h1>
        <p>Manage product catalog and inventory (placeholder)</p>
      </header>

      <section className={styles.section}>
        <p>Product management UI will be implemented here.</p>
      </section>
    </div>
  );
}
