import { allProducts } from '@/config/products';
import { getProductTotalStock, getStockSummary, getLowStockProducts } from '@/lib/inventory';
import styles from '../../admin.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  const products = allProducts;
  const summary = getStockSummary();
  const lowStockProducts = getLowStockProducts();
  
  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Lagerbestand</h1>
        <p className={styles.pageSubtitle}>
          Übersicht über Produktverfügbarkeit und Bestandswarnungen
        </p>
      </div>

      {/* Summary Stats */}
      <div className={styles.statsGrid} style={{ marginBottom: 30 }}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{summary.totalProducts}</div>
          <div className={styles.statLabel}>Produkte gesamt</div>
        </div>
        <div className={styles.statCard} style={{ borderColor: '#22c55e' }}>
          <div className={styles.statValue} style={{ color: '#22c55e' }}>
            {summary.inStock}
          </div>
          <div className={styles.statLabel}>Auf Lager</div>
        </div>
        <div className={styles.statCard} style={{ borderColor: '#f59e0b' }}>
          <div className={styles.statValue} style={{ color: '#f59e0b' }}>
            {summary.lowStock}
          </div>
          <div className={styles.statLabel}>Niedriger Bestand</div>
        </div>
        <div className={styles.statCard} style={{ borderColor: '#ef4444' }}>
          <div className={styles.statValue} style={{ color: '#ef4444' }}>
            {summary.outOfStock}
          </div>
          <div className={styles.statLabel}>Ausverkauft</div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className={styles.card} style={{ marginBottom: 30, borderColor: '#f59e0b' }}>
          <div className={styles.cardHeader} style={{ background: '#fffbeb' }}>
            <h2 style={{ color: '#b45309' }}>⚠️ Bestandswarnungen</h2>
          </div>
          <div style={{ padding: 20 }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Aktueller Bestand</th>
                  <th>Schwellenwert</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.name.de}
                            style={{ 
                              width: 40, 
                              height: 40, 
                              objectFit: 'cover',
                              borderRadius: 6 
                            }}
                          />
                        )}
                        <strong>{product.name.de}</strong>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        color: product.currentStock === 0 ? '#ef4444' : '#f59e0b',
                      }}>
                        {product.currentStock}
                      </span>
                    </td>
                    <td>{product.lowStockThreshold}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: product.currentStock === 0 ? '#fee2e2' : '#fef3c7',
                        color: product.currentStock === 0 ? '#dc2626' : '#b45309',
                      }}>
                        {product.currentStock === 0 ? 'AUSVERKAUFT' : 'NIEDRIGER BESTAND'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full Inventory Table */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>📦 Vollständiger Bestand</h2>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Produkt</th>
              <th>Marke</th>
              <th>Preis</th>
              <th>Bestand</th>
              <th>Schwelle</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const currentStock = getProductTotalStock(product.id);
              const isLow = currentStock <= product.lowStockThreshold && currentStock > 0;
              const isOut = currentStock === 0;
              
              return (
                <tr key={product.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.name.de}
                          style={{ 
                            width: 50, 
                            height: 50, 
                            objectFit: 'cover',
                            borderRadius: 8 
                          }}
                        />
                      )}
                      <div>
                        <strong>{product.name.de}</strong>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                          {product.origin.de}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      background: product.brand === 'coffee' ? '#fef3c7' : '#d1fae5',
                      color: product.brand === 'coffee' ? '#92400e' : '#065f46',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {product.brand === 'coffee' ? 'Kaffee' : 'Tee'}
                    </span>
                  </td>
                  <td>{formatPrice(product.basePrice)}</td>
                  <td>
                    <span style={{
                      fontWeight: 600,
                      color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#22c55e',
                    }}>
                      {currentStock}
                    </span>
                  </td>
                  <td style={{ color: '#666' }}>{product.lowStockThreshold}</td>
                  <td>
                    {isOut ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: '#fee2e2',
                        color: '#dc2626',
                      }}>
                        Ausverkauft
                      </span>
                    ) : isLow ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: '#fef3c7',
                        color: '#b45309',
                      }}>
                        Niedrig
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: '#d1fae5',
                        color: '#065f46',
                      }}>
                        Verfügbar
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: 30,
        padding: 20,
        background: '#f0f9ff',
        borderRadius: 8,
        border: '1px solid #bae6fd',
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>
          ℹ️ Bestandsverwaltung
        </h3>
        <p style={{ margin: 0, color: '#0c4a6e' }}>
          Der Bestand wird automatisch bei jeder Bestellung reduziert und bei Erstattungen wiederhergestellt.
          Für manuelle Bestandsanpassungen bearbeite die Produktkonfiguration in <code>src/config/products/</code>.
          Die tägliche E-Mail-Zusammenfassung enthält Warnungen bei niedrigem Bestand.
        </p>
      </div>
    </div>
  );
}
