import Link from 'next/link';
import styles from './admin.module.css';

export default function AdminLandingPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Admin</h1>
        <p>Access the dashboard and management tools</p>
      </header>

      <nav className={styles.nav}>
        <ul>
          <li><Link href="/admin/(dashboard)">Dashboard</Link></li>
          <li><Link href="/admin/login">Login</Link></li>
        </ul>
      </nav>
    </div>
  );
}
