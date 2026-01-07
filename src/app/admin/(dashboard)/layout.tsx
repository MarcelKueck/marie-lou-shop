import Link from 'next/link';
import './dashboard.module.css';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '1rem' }}>
      <nav style={{ marginBottom: '1rem' }}>
        <Link href="/admin">Admin</Link> | <Link href="/admin/(dashboard)">Dashboard</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
