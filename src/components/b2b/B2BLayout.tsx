import B2BNavigation from '@/components/b2b/B2BNavigation';
import B2BFooter from '@/components/b2b/B2BFooter';
import styles from './B2BLayout.module.css';

interface B2BLayoutProps {
  children: React.ReactNode;
}

export default function B2BLayout({ children }: B2BLayoutProps) {
  return (
    <div className={styles.layout}>
      <B2BNavigation />
      <main className={styles.main}>
        {children}
      </main>
      <B2BFooter />
    </div>
  );
}
