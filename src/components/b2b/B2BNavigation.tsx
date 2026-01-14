'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import styles from './B2BNavigation.module.css';

export default function B2BNavigation() {
  const t = useTranslations('b2b');
  const pathname = usePathname();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { href: '/b2b', label: t('nav.overview') },
    { href: '/b2b/pricing', label: t('nav.pricing') },
    { href: '/b2b/waitlist', label: t('nav.smartbox') },
  ];

  return (
    <nav className={`${styles.nav} ${isScrolled ? styles.scrolled : ''}`}>
      <Link href="/" className={styles.logo}>
        <Image
          src="/images/logos/marieloucoffee.svg"
          alt="Marie Lou Coffee"
          width={112}
          height={112}
          priority
        />
      </Link>

      {/* Desktop Navigation */}
      <div className={styles.navCenter}>
        <ul className={styles.navLinks}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={pathname === link.href ? styles.active : ''}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.navActions}>
        <LanguageSwitcher />
        
        <Link href="/b2b/login" className={styles.loginLink}>
          {t('nav.login')}
        </Link>
        
        <Link href="/b2b/inquiry" className={styles.ctaButton}>
          {t('nav.getStarted')}
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          className={styles.mobileMenuToggle}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`${styles.hamburger} ${isMobileMenuOpen ? styles.open : ''}`} />
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.open : ''}`}>
        <ul>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={handleLinkClick}>
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/b2b/login" onClick={handleLinkClick}>
              {t('nav.login')}
            </Link>
          </li>
          <li>
            <Link href="/b2b/inquiry" onClick={handleLinkClick} className={styles.mobileCta}>
              {t('nav.getStarted')}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
