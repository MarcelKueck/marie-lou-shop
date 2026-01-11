import Link from 'next/link';
import styles from './dashboard.module.css';
import LogoutButton from './LogoutButton';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <nav className={styles.sidebar}>
        <div className={styles.logo}>
          <Link href="/admin">Admin Panel</Link>
        </div>
        <ul className={styles.navList}>
          <li><Link href="/admin">Dashboard</Link></li>
          <li><Link href="/admin/orders">Orders</Link></li>
          <li><Link href="/admin/refunds">Refunds</Link></li>
          <li><Link href="/admin/reviews">Reviews</Link></li>
          <li><Link href="/admin/gift-cards">Gift Cards</Link></li>
          <li><Link href="/admin/products">Products</Link></li>
          <li><Link href="/admin/inventory">Inventory</Link></li>
          <li><Link href="/admin/customers">Customers</Link></li>
          <li><Link href="/admin/referrals">Referrals</Link></li>
          <li><Link href="/admin/analytics">Analytics</Link></li>
          <li><Link href="/admin/settings">Settings</Link></li>
        </ul>
        <div className={styles.sidebarFooter}>
          <LogoutButton />
        </div>
      </nav>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
