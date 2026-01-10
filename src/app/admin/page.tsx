import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export default async function AdminLandingPage() {
  const isAuthenticated = await isAdminAuthenticated();
  
  if (isAuthenticated) {
    redirect('/admin/refunds');
  } else {
    redirect('/admin/login');
  }
}
