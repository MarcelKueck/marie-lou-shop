'use client';

import { useState } from 'react';
import styles from '../dashboard.module.css';

interface Settings {
  // Shipping
  freeShippingThreshold: number;
  standardShippingCost: number;
  expressShippingCost: number;
  
  // Stock
  lowStockThreshold: number;
  
  // Email
  adminEmail: string;
  sendDailySummary: boolean;
  sendLowStockAlerts: boolean;
  
  // Store Info
  storeName: string;
  storeAddress: string;
  storeCity: string;
  storePostalCode: string;
  storeCountry: string;
  vatId: string;
}

// Calculate 30 days ago date string
function get30DaysAgoString(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    freeShippingThreshold: 5000, // €50
    standardShippingCost: 490,   // €4.90
    expressShippingCost: 990,    // €9.90
    lowStockThreshold: 10,
    adminEmail: 'marcel@marielou.de',
    sendDailySummary: true,
    sendLowStockAlerts: true,
    storeName: 'Marie Lou Coffee',
    storeAddress: 'Musterstraße 1',
    storeCity: 'München',
    storePostalCode: '80331',
    storeCountry: 'Deutschland',
    vatId: 'DE123456789',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real implementation, this would save to database/config
    console.log('Settings to save:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Einstellungen</h1>
        <p className={styles.pageSubtitle}>
          Shop-Konfiguration und Benachrichtigungen verwalten
        </p>
      </div>

      {saved && (
        <div style={{
          padding: '12px 20px',
          background: '#d1fae5',
          color: '#065f46',
          borderRadius: 8,
          marginBottom: 20,
        }}>
          ✓ Einstellungen gespeichert
        </div>
      )}

      {/* Shipping Settings */}
      <div className={styles.card} style={{ marginBottom: 20 }}>
        <div className={styles.cardHeader}>
          <h2>📦 Versand</h2>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gap: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Gratis Versand ab (€)
              </label>
              <input
                type="number"
                value={settings.freeShippingThreshold / 100}
                onChange={(e) => updateSetting('freeShippingThreshold', parseFloat(e.target.value) * 100)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  width: 150,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Standard Versandkosten (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.standardShippingCost / 100}
                onChange={(e) => updateSetting('standardShippingCost', parseFloat(e.target.value) * 100)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  width: 150,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Express Versandkosten (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.expressShippingCost / 100}
                onChange={(e) => updateSetting('expressShippingCost', parseFloat(e.target.value) * 100)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  width: 150,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Settings */}
      <div className={styles.card} style={{ marginBottom: 20 }}>
        <div className={styles.cardHeader}>
          <h2>📊 Lagerbestand</h2>
        </div>
        <div style={{ padding: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Niedriger Lagerbestand Schwellenwert
            </label>
            <input
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) => updateSetting('lowStockThreshold', parseInt(e.target.value))}
              style={{
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                width: 150,
              }}
            />
            <p style={{ marginTop: 8, fontSize: '0.875rem', color: '#666' }}>
              Bei Unterschreitung wird eine Warnung angezeigt und optional eine E-Mail gesendet.
            </p>
          </div>
        </div>
      </div>

      {/* Email Settings */}
      <div className={styles.card} style={{ marginBottom: 20 }}>
        <div className={styles.cardHeader}>
          <h2>✉️ E-Mail Benachrichtigungen</h2>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gap: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Admin E-Mail
              </label>
              <input
                type="email"
                value={settings.adminEmail}
                onChange={(e) => updateSetting('adminEmail', e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  width: 300,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.sendDailySummary}
                  onChange={(e) => updateSetting('sendDailySummary', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontWeight: 500 }}>Tägliche Zusammenfassung senden</span>
              </label>
              <p style={{ marginTop: 4, marginLeft: 28, fontSize: '0.875rem', color: '#666' }}>
                Erhalte jeden Morgen eine Übersicht der Bestellungen des Vortags.
              </p>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.sendLowStockAlerts}
                  onChange={(e) => updateSetting('sendLowStockAlerts', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontWeight: 500 }}>Lagerbestand-Warnungen senden</span>
              </label>
              <p style={{ marginTop: 4, marginLeft: 28, fontSize: '0.875rem', color: '#666' }}>
                Erhalte eine E-Mail wenn Produkte unter den Schwellenwert fallen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Store Information */}
      <div className={styles.card} style={{ marginBottom: 20 }}>
        <div className={styles.cardHeader}>
          <h2>🏪 Geschäftsinformationen</h2>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ marginBottom: 20, color: '#666' }}>
            Diese Informationen werden auf Rechnungen und in der Fußzeile angezeigt.
          </p>
          <div style={{ display: 'grid', gap: 20, maxWidth: 500 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Firmenname
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => updateSetting('storeName', e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  width: '100%',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Adresse
              </label>
              <input
                type="text"
                value={settings.storeAddress}
                onChange={(e) => updateSetting('storeAddress', e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  width: '100%',
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  PLZ
                </label>
                <input
                  type="text"
                  value={settings.storePostalCode}
                  onChange={(e) => updateSetting('storePostalCode', e.target.value)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    width: '100%',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Stadt
                </label>
                <input
                  type="text"
                  value={settings.storeCity}
                  onChange={(e) => updateSetting('storeCity', e.target.value)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    width: '100%',
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                USt-IdNr.
              </label>
              <input
                type="text"
                value={settings.vatId}
                onChange={(e) => updateSetting('vatId', e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  width: '100%',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className={styles.card} style={{ marginBottom: 20 }}>
        <div className={styles.cardHeader}>
          <h2>📤 Datenexport</h2>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ marginBottom: 20, color: '#666' }}>
            Exportiere Bestellungen als CSV-Datei für die Buchhaltung oder externe Auswertung.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href="/api/admin/export/orders"
              download
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              📥 Alle Bestellungen exportieren
            </a>
            <a
              href={`/api/admin/export/orders?from=${get30DaysAgoString()}`}
              download
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: '#f3f4f6',
                color: '#374151',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              📥 Letzte 30 Tage
            </a>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ marginTop: 30 }}>
        <button
          onClick={handleSave}
          style={{
            padding: '12px 24px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Einstellungen speichern
        </button>
        <p style={{ marginTop: 10, fontSize: '0.875rem', color: '#666' }}>
          Hinweis: Einige Einstellungen werden derzeit über Umgebungsvariablen konfiguriert.
        </p>
      </div>
    </div>
  );
}
