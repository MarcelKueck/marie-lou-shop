'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import styles from './portal.module.css';

interface PortalNavProps {
  company: {
    id: string;
    companyName: string;
    tier: string;
    contactName: string;
  };
  locale: string;
}

export default function PortalNav({ company, locale }: PortalNavProps) {
  const t = useTranslations('b2b.portal.nav');
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  
  const isSmart = company.tier === 'smart';
  
  const navItems = [
    { href: '/b2b/portal', label: t('dashboard'), icon: '📊' },
    { href: '/b2b/portal/shop', label: t('shop'), icon: '🛒' },
    { href: '/b2b/portal/orders', label: t('orders'), icon: '📦' },
    ...(isSmart ? [{ href: '/b2b/portal/smartbox', label: t('smartbox'), icon: '📡' }] : []),
    { href: '/b2b/portal/sustainability', label: t('sustainability'), icon: '🌱' },
    { href: '/b2b/portal/account', label: t('account'), icon: '⚙️' },
  ];
  
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/b2b/auth/logout', { method: 'POST' });
      router.push(`/${locale}/b2b/login`);
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };
  
  return (
    <nav className={styles.nav}>
      <div className={styles.navTop}>
        <Link href="/b2b" className={styles.logo}>
          Marie Lou <span className={styles.b2bBadge}>B2B</span>
        </Link>
        
        <div className={styles.companyInfo}>
          <span className={styles.companyName}>{company.companyName}</span>
          <span className={styles.tierBadge}>{company.tier.toUpperCase()}</span>
        </div>
      </div>
      
      <ul className={styles.navLinks}>
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      
      {!isSmart && (
        <div className={styles.upgradeBox}>
          <p className={styles.upgradeText}>Unlock SmartBox features</p>
          <Link href="/b2b/inquiry?tier=smart" className={styles.upgradeLink}>
            {t('upgrade')}
          </Link>
        </div>
      )}
      
      <div className={styles.navBottom}>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{company.contactName}</span>
        </div>
        <button 
          onClick={handleLogout} 
          className={styles.logoutButton}
          disabled={loggingOut}
        >
          {loggingOut ? '...' : 'Logout'}
        </button>
      </div>
    </nav>
  );
}
