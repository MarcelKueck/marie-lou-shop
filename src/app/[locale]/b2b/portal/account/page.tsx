'use client';

import { useState } from 'react';
import styles from './account.module.css';

interface CompanyInfo {
  id: string;
  companyName: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  vatId: string;
  tier: string;
  shippingLine1: string;
  shippingLine2: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  billingLine1: string;
  billingLine2: string;
  billingCity: string;
  billingPostalCode: string;
  billingCountry: string;
}

export default function B2BAccountPage() {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState<'company' | 'shipping' | 'billing' | 'password'>('company');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  useState(() => {
    async function fetchCompanyInfo() {
      try {
        const response = await fetch('/api/b2b/account');
        const data = await response.json();
        if (data.company) {
          setCompany(data.company);
        }
      } catch (error) {
        console.error('Failed to fetch company info:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCompanyInfo();
  });
  
  const handleSaveCompany = async () => {
    if (!company) return;
    
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/b2b/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      });
      
      if (response.ok) {
        setMessage('Settings saved successfully!');
      } else {
        setMessage('Failed to save settings.');
      }
    } catch {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    
    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }
    
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/b2b/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      if (response.ok) {
        setMessage('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to change password.');
      }
    } catch {
      setMessage('Failed to change password.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }
  
  if (!company) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>Failed to load account information.</div>
      </div>
    );
  }
  
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account Settings</h1>
      </header>
      
      <div className={styles.content}>
        <nav className={styles.sectionNav}>
          <button
            className={`${styles.navButton} ${activeSection === 'company' ? styles.active : ''}`}
            onClick={() => setActiveSection('company')}
          >
            Company Info
          </button>
          <button
            className={`${styles.navButton} ${activeSection === 'shipping' ? styles.active : ''}`}
            onClick={() => setActiveSection('shipping')}
          >
            Shipping Address
          </button>
          <button
            className={`${styles.navButton} ${activeSection === 'billing' ? styles.active : ''}`}
            onClick={() => setActiveSection('billing')}
          >
            Billing Address
          </button>
          <button
            className={`${styles.navButton} ${activeSection === 'password' ? styles.active : ''}`}
            onClick={() => setActiveSection('password')}
          >
            Change Password
          </button>
        </nav>
        
        <div className={styles.formSection}>
          {message && (
            <div className={`${styles.message} ${message.includes('Failed') || message.includes('match') ? styles.error : styles.success}`}>
              {message}
            </div>
          )}
          
          {activeSection === 'company' && (
            <div className={styles.form}>
              <h2 className={styles.sectionTitle}>Company Information</h2>
              
              <div className={styles.field}>
                <label>Company Name</label>
                <input
                  type="text"
                  value={company.companyName}
                  onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                />
              </div>
              
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>First Name</label>
                  <input
                    type="text"
                    value={company.contactFirstName}
                    onChange={(e) => setCompany({ ...company, contactFirstName: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={company.contactLastName}
                    onChange={(e) => setCompany({ ...company, contactLastName: e.target.value })}
                  />
                </div>
              </div>
              
              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  value={company.contactEmail}
                  disabled
                  className={styles.disabled}
                />
                <span className={styles.hint}>Contact support to change email</span>
              </div>
              
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={company.contactPhone || ''}
                    onChange={(e) => setCompany({ ...company, contactPhone: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>VAT ID</label>
                  <input
                    type="text"
                    value={company.vatId || ''}
                    onChange={(e) => setCompany({ ...company, vatId: e.target.value })}
                  />
                </div>
              </div>
              
              <div className={styles.tierInfo}>
                <span className={styles.tierLabel}>Current Tier:</span>
                <span className={styles.tierBadge}>{company.tier.toUpperCase()}</span>
              </div>
              
              <button
                className={styles.saveButton}
                onClick={handleSaveCompany}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
          
          {activeSection === 'shipping' && (
            <div className={styles.form}>
              <h2 className={styles.sectionTitle}>Shipping Address</h2>
              
              <div className={styles.field}>
                <label>Street Address</label>
                <input
                  type="text"
                  value={company.shippingLine1 || ''}
                  onChange={(e) => setCompany({ ...company, shippingLine1: e.target.value })}
                />
              </div>
              
              <div className={styles.field}>
                <label>Address Line 2 (optional)</label>
                <input
                  type="text"
                  value={company.shippingLine2 || ''}
                  onChange={(e) => setCompany({ ...company, shippingLine2: e.target.value })}
                />
              </div>
              
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>City</label>
                  <input
                    type="text"
                    value={company.shippingCity || ''}
                    onChange={(e) => setCompany({ ...company, shippingCity: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Postal Code</label>
                  <input
                    type="text"
                    value={company.shippingPostalCode || ''}
                    onChange={(e) => setCompany({ ...company, shippingPostalCode: e.target.value })}
                  />
                </div>
              </div>
              
              <div className={styles.field}>
                <label>Country</label>
                <select
                  value={company.shippingCountry || 'DE'}
                  onChange={(e) => setCompany({ ...company, shippingCountry: e.target.value })}
                >
                  <option value="DE">Germany</option>
                  <option value="AT">Austria</option>
                  <option value="CH">Switzerland</option>
                </select>
              </div>
              
              <button
                className={styles.saveButton}
                onClick={handleSaveCompany}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
          
          {activeSection === 'billing' && (
            <div className={styles.form}>
              <h2 className={styles.sectionTitle}>Billing Address</h2>
              
              <div className={styles.field}>
                <label>Street Address</label>
                <input
                  type="text"
                  value={company.billingLine1 || ''}
                  onChange={(e) => setCompany({ ...company, billingLine1: e.target.value })}
                />
              </div>
              
              <div className={styles.field}>
                <label>Address Line 2 (optional)</label>
                <input
                  type="text"
                  value={company.billingLine2 || ''}
                  onChange={(e) => setCompany({ ...company, billingLine2: e.target.value })}
                />
              </div>
              
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>City</label>
                  <input
                    type="text"
                    value={company.billingCity || ''}
                    onChange={(e) => setCompany({ ...company, billingCity: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Postal Code</label>
                  <input
                    type="text"
                    value={company.billingPostalCode || ''}
                    onChange={(e) => setCompany({ ...company, billingPostalCode: e.target.value })}
                  />
                </div>
              </div>
              
              <div className={styles.field}>
                <label>Country</label>
                <select
                  value={company.billingCountry || 'DE'}
                  onChange={(e) => setCompany({ ...company, billingCountry: e.target.value })}
                >
                  <option value="DE">Germany</option>
                  <option value="AT">Austria</option>
                  <option value="CH">Switzerland</option>
                </select>
              </div>
              
              <button
                className={styles.saveButton}
                onClick={handleSaveCompany}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
          
          {activeSection === 'password' && (
            <form className={styles.form} onSubmit={handlePasswordChange}>
              <h2 className={styles.sectionTitle}>Change Password</h2>
              
              <div className={styles.field}>
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className={styles.field}>
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <span className={styles.hint}>Minimum 8 characters</span>
              </div>
              
              <div className={styles.field}>
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <button
                type="submit"
                className={styles.saveButton}
                disabled={saving}
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
