import { db } from '@/db';
import { reviews } from '@/db/schema';
import { desc } from 'drizzle-orm';
import styles from '../dashboard.module.css';
import ReviewActions from './ReviewActions';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const allReviews = await db.query.reviews.findMany({
    orderBy: [desc(reviews.createdAt)],
  });
  
  const pendingReviews = allReviews.filter(r => r.status === 'pending');
  const approvedReviews = allReviews.filter(r => r.status === 'approved');
  const rejectedReviews = allReviews.filter(r => r.status === 'rejected');
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Reviews</h1>
        <p>{allReviews.length} reviews total</p>
      </header>
      
      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#f59e0b' }}>{pendingReviews.length}</span>
          <span className={styles.statLabel}>Pending</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#22c55e' }}>{approvedReviews.length}</span>
          <span className={styles.statLabel}>Approved</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#ef4444' }}>{rejectedReviews.length}</span>
          <span className={styles.statLabel}>Rejected</span>
        </div>
      </div>
      
      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <section className={styles.section}>
          <h2 style={{ marginBottom: '1rem', color: '#f59e0b' }}>⏳ Pending Reviews ({pendingReviews.length})</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Customer</th>
                  <th>Content</th>
                  <th>Verified</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingReviews.map(review => (
                  <tr key={review.id}>
                    <td>{review.productSlug}</td>
                    <td>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</td>
                    <td>{review.customerName}</td>
                    <td style={{ maxWidth: '300px' }}>
                      {review.title && <strong>{review.title}<br /></strong>}
                      {review.content?.substring(0, 100)}{review.content && review.content.length > 100 ? '...' : ''}
                    </td>
                    <td>{review.verifiedPurchase ? '✓' : '-'}</td>
                    <td>{review.createdAt?.toLocaleDateString('en-US')}</td>
                    <td>
                      <ReviewActions reviewId={review.id} currentStatus={review.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      
      {/* All Reviews Table */}
      <section className={styles.section}>
        <h2 style={{ marginBottom: '1rem' }}>All Reviews</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Rating</th>
                <th>Customer</th>
                <th>Title</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allReviews.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                    No reviews yet.
                  </td>
                </tr>
              ) : (
                allReviews.map(review => (
                  <tr key={review.id}>
                    <td>{review.productSlug}</td>
                    <td style={{ color: review.rating >= 4 ? '#22c55e' : review.rating >= 3 ? '#f59e0b' : '#ef4444' }}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </td>
                    <td>{review.customerName}</td>
                    <td>{review.title || '-'}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: review.status === 'approved' ? '#dcfce7' : review.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                        color: review.status === 'approved' ? '#166534' : review.status === 'rejected' ? '#991b1b' : '#92400e',
                      }}>
                        {review.status === 'approved' ? 'Approved' : review.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td>{review.verifiedPurchase ? '✓ Verified' : '-'}</td>
                    <td>{review.createdAt?.toLocaleDateString('en-US')}</td>
                    <td>
                      <ReviewActions reviewId={review.id} currentStatus={review.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
