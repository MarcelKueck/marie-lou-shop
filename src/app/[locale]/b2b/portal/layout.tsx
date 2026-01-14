import { redirect } from 'next/navigation';
import { getCurrentB2BCompany } from '@/lib/b2b-auth';
import { setRequestLocale } from 'next-intl/server';
import PortalNav from './PortalNav';
import styles from './portal.module.css';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function B2BPortalLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const company = await getCurrentB2BCompany();
  
  if (!company) {
    redirect(`/${locale}/b2b/login`);
  }
  
  // Only allow active, pending, or paused companies
  if (!['active', 'pending', 'paused'].includes(company.status)) {
    redirect(`/${locale}/b2b/login`);
  }
  
  return (
    <div className={styles.portalContainer}>
      <PortalNav 
        company={{
          id: company.id,
          companyName: company.companyName,
          tier: company.tier,
          contactName: `${company.contactFirstName} ${company.contactLastName}`,
        }}
        locale={locale}
      />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
