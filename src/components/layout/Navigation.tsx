'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useBrand } from '@/hooks/useBrand';
import { useCart } from '@/hooks/useCart';
import LanguageSwitcher from './LanguageSwitcher';
import styles from './Navigation.module.css';

interface NavigationProps {
  onCartClick?: () => void;
}

export default function Navigation({ onCartClick }: NavigationProps) {
  const t = useTranslations('nav');
  const { brand } = useBrand();
  const { itemCount } = useCart();
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

  // Close mobile menu when clicking a link
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    }
  };

  const navLinksLeft = [
    { href: '/story', label: t('ourStory') },
    { href: '/shop', label: t('shop') },
  ];

  const navLinksRight = [
    { href: '/#process', label: t('howItWorks') },
    { href: '/#contact', label: t('contact') },
  ];

  const allNavLinks = [...navLinksLeft, ...navLinksRight];

  return (
    <nav className={`${styles.nav} ${isScrolled ? styles.scrolled : ''}`}>
      <Link href="/" className={styles.logo}>
        <Image
          src={brand.logo}
          alt={`${brand.name} Logo`}
          width={96}
          height={96}
          priority
          style={{ width: 'auto', height: 'auto' }}
        />
      </Link>

      {/* Desktop Navigation */}
      <div className={styles.navCenter}>
        <ul className={styles.navLinks}>
          {navLinksLeft.map((link) => (
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
        <ul className={styles.navLinks}>
          {navLinksRight.map((link) => (
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
        
        <button className={styles.cartButton} onClick={handleCartClick}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {t('cart')} ({itemCount})
        </button>

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
          {allNavLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={handleLinkClick}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
