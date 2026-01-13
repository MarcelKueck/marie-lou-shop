import { getAllProducts } from '@/lib/products';
import { getStockSummary, getLowStockProducts } from '@/lib/inventory';
import styles from '../dashboard.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  const products = await getAllProducts();
  const summary = await getStockSummary();
  const lowStockProducts = await getLowStockProducts();
  
  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Inventory</h1>
        <p>Product availability and stock alerts</p>
      </header>

      {/* Summary Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{summary.totalProducts}</span>
          <span className={styles.statLabel}>Total Products</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#22c55e' }}>
            {summary.inStock}
          </span>
          <span className={styles.statLabel}>In Stock</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#f59e0b' }}>
            {summary.lowStock}
          </span>
          <span className={styles.statLabel}>Low Stock</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#ef4444' }}>
            {summary.outOfStock}
          </span>
          <span className={styles.statLabel}>Out of Stock</span>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <section className={styles.section} style={{ background: '#fffbeb', borderColor: '#fde047' }}>
          <h2 style={{ marginBottom: '1rem', color: '#b45309' }}>⚠️ Stock Alerts</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Threshold</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
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
                        {product.currentStock === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Full Inventory Table */}
      <section className={styles.section}>
        <h2 style={{ marginBottom: '1rem' }}>📦 Full Inventory</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const currentStock = product.stockQuantity ?? 0;
                const threshold = product.lowStockThreshold ?? 5;
                const isLow = currentStock <= threshold && currentStock > 0;
                const isOut = currentStock === 0;
                
                return (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.name.en}
                            style={{ 
                              width: 50, 
                              height: 50, 
                              objectFit: 'cover',
                              borderRadius: 8 
                            }}
                          />
                        )}
                        <div>
                          <strong>{product.name.en}</strong>
                          <div style={{ fontSize: '0.875rem', color: '#666' }}>
                            {product.origin?.en ?? ''}
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
                        {product.brand === 'coffee' ? 'Coffee' : 'Tea'}
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
                    <td style={{ color: '#666' }}>{threshold}</td>
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
                          Out of Stock
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
                          Low
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
                          Available
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Info Box */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1.25rem',
        background: '#f0f9ff',
        borderRadius: 8,
        border: '1px solid #bae6fd',
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#0369a1' }}>
          ℹ️ Inventory Management
        </h3>
        <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.875rem' }}>
          Stock is automatically reduced with each order and restored on refunds.
          For manual stock adjustments, edit products in the admin panel under &quot;Products&quot;.
          The daily email summary includes low stock warnings.
        </p>
      </div>
    </div>
  );
}
