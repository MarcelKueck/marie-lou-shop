import { Suspense } from 'react';
import Link from 'next/link';
import LoginForm from './LoginForm';
import styles from './login.module.css';

export default function AdminLoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Admin Login</h1>
        <p className={styles.subtitle}>Sign in to access the admin dashboard</p>
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
        <Link href="/" className={styles.backLink}>
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
