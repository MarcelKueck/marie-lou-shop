'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../dashboard.module.css';
import Link from 'next/link';

interface ProductVariant {
  id: string;
  name: { en: string; de: string };
  nameEn?: string;
  nameDe?: string;
  priceModifier: number;
  sku: string | null;
  weight: string | null;
  active: boolean;
}

interface Product {
  id: string;
  slug: string;
  brand: 'coffee' | 'tea';
  active: boolean;
  name: { en: string; de: string };
  origin?: { en: string | null; de: string | null };
  notes?: { en: string | null; de: string | null };
  description?: { en: string | null; de: string | null };
  basePrice: number;
  currency: string;
  stockQuantity: number | null;
  lowStockThreshold: number | null;
  image: string | null;
  badge: string | null;
  variants: ProductVariant[];
}

interface EditingVariant {
  id?: string;
  _tempId?: string;
  name?: { en: string; de: string };
  nameEn?: string;
  nameDe?: string;
  priceModifier?: number;
  sku?: string | null;
  weight?: string | null;
  active?: boolean;
}

interface EditingProduct {
  id?: string;
  slug?: string;
  brand?: 'coffee' | 'tea';
  active?: boolean;
  name?: { en: string; de: string };
  origin?: { en: string | null; de: string | null };
  notes?: { en: string | null; de: string | null };
  description?: { en: string | null; de: string | null };
  basePrice?: number;
  currency?: string;
  stockQuantity?: number | null;
  lowStockThreshold?: number | null;
  image?: string | null;
  badge?: string | null;
  variants?: EditingVariant[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/products?includeInactive=${showInactive}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading products');
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      setEditingProduct({ ...editingProduct, image: data.url });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (brandFilter !== 'all' && p.brand !== brandFilter) return false;
    return true;
  });

  const coffeeCount = products.filter(p => p.brand === 'coffee').length;
  const teaCount = products.filter(p => p.brand === 'tea').length;
  const variantCount = products.reduce((sum, p) => sum + p.variants.length, 0);

  const handleCreateNew = () => {
    setEditingProduct({
      slug: '',
      brand: 'coffee',
      active: true,
      name: { en: '', de: '' },
      origin: { en: '', de: '' },
      notes: { en: '', de: '' },
      description: { en: '', de: '' },
      basePrice: 0,
      currency: 'EUR',
      stockQuantity: 100,
      lowStockThreshold: 10,
      image: '',
      badge: null,
      variants: [],
    });
    setShowModal(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct({
      ...product,
      variants: product.variants.map(v => ({ ...v })),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    setSaving(true);
    setError(null);

    try {
      const isNew = !editingProduct.id;
      const url = isNew ? '/api/admin/products' : `/api/admin/products/${editingProduct.id}`;
      const method = isNew ? 'POST' : 'PUT';

      // Transform variants for API
      const variants = editingProduct.variants?.map(v => ({
        id: v._tempId ? undefined : v.id,
        name: v.name || { en: v.nameEn || '', de: v.nameDe || '' },
        nameEn: v.name?.en || v.nameEn,
        nameDe: v.name?.de || v.nameDe,
        priceModifier: v.priceModifier || 0,
        sku: v.sku,
        weight: v.weight,
        active: v.active !== false,
      }));

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingProduct,
          variants,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save product');
      }

      setShowModal(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete product');

      setDeleteConfirm(null);
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting product');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !product.active }),
      });

      if (!res.ok) throw new Error('Failed to update product');
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating product');
    }
  };

  const addVariant = () => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      variants: [
        ...(editingProduct.variants || []),
        {
          _tempId: `temp-${Date.now()}`,
          name: { en: '', de: '' },
          priceModifier: 0,
          sku: null,
          weight: null,
          active: true,
        },
      ],
    });
  };

  const removeVariant = (index: number) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      variants: editingProduct.variants?.filter((_, i) => i !== index),
    });
  };

  const updateVariant = (index: number, field: string, value: string | number | boolean) => {
    if (!editingProduct) return;
    const variants = [...(editingProduct.variants || [])];
    
    if (field.startsWith('name.')) {
      const lang = field.split('.')[1];
      variants[index] = {
        ...variants[index],
        name: {
          ...(variants[index].name || { en: '', de: '' }),
          [lang]: value,
        },
      };
    } else {
      variants[index] = { ...variants[index], [field]: value };
    }
    
    setEditingProduct({ ...editingProduct, variants });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading products...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className={styles.pageTitle}>Products</h1>
            <p className={styles.pageSubtitle}>
              Manage product catalog - add, edit and delete products.
            </p>
          </div>
          <button 
            onClick={handleCreateNew}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            + New Product
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '12px 16px', 
          background: '#fee2e2', 
          color: '#991b1b', 
          borderRadius: 8, 
          marginBottom: 20 
        }}>
          {error}
          <button 
            onClick={() => setError(null)} 
            style={{ marginLeft: 10, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats */}
      <div className={styles.statsGrid} style={{ marginBottom: 30 }}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{products.length}</div>
          <div className={styles.statLabel}>Total Products</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{coffeeCount}</div>
          <div className={styles.statLabel}>Coffee</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{teaCount}</div>
          <div className={styles.statLabel}>Tea</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{variantCount}</div>
          <div className={styles.statLabel}>Variants</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select 
          value={brandFilter} 
          onChange={(e) => setBrandFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Brands</option>
          <option value="coffee">Coffee</option>
          <option value="tea">Tea</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </div>

      {/* Products Table */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Product Catalog ({filteredProducts.length})</h2>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Brand</th>
              <th>Status</th>
              <th>Base Price</th>
              <th>Stock</th>
              <th>Variants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} style={{ opacity: product.active ? 1 : 0.6 }}>
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
                        {product.name.en}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`${styles.badge} ${product.brand === 'coffee' ? styles.badgeWarning : styles.badgeSuccess}`}>
                    {product.brand}
                  </span>
                </td>
                <td>
                  <span 
                    className={`${styles.badge} ${product.active ? styles.badgeSuccess : styles.badgeError}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleToggleActive(product)}
                    title="Click to toggle"
                  >
                    {product.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{formatPrice(product.basePrice)}</td>
                <td>
                  <span style={{
                    color: (product.stockQuantity || 0) <= (product.lowStockThreshold || 10) ? '#dc2626' : 'inherit'
                  }}>
                    {product.stockQuantity ?? '∞'}
                  </span>
                </td>
                <td>{product.variants.length}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleEdit(product)}
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      Edit
                    </button>
                    <Link 
                      href={`/de/shop/${product.slug}`}
                      target="_blank"
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      style={{ padding: '6px 12px', fontSize: '0.75rem', textDecoration: 'none' }}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      className={`${styles.button}`}
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '0.75rem',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fecaca',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: '90%',
          }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Delete Product?</h3>
            <p style={{ color: '#666', marginBottom: 20 }}>
              The product and all associated variants will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className={styles.button}
                style={{ background: '#dc2626', color: 'white' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && editingProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 1000,
          overflow: 'auto',
          padding: '40px 20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            maxWidth: 800,
            width: '100%',
            maxHeight: 'calc(100vh - 80px)',
            overflow: 'auto',
          }}>
            <h2 style={{ margin: '0 0 20px 0' }}>
              {editingProduct.id ? 'Edit Product' : 'New Product'}
            </h2>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Slug (URL)</label>
                  <input
                    type="text"
                    value={editingProduct.slug || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                    className={styles.input}
                    placeholder="e.g. ethiopia-yirgacheffe"
                    disabled={!!editingProduct.id}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Brand</label>
                  <select
                    value={editingProduct.brand || 'coffee'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value as 'coffee' | 'tea' })}
                    className={styles.select}
                  >
                    <option value="coffee">Coffee</option>
                    <option value="tea">Tea</option>
                  </select>
                </div>
              </div>

              {/* Names */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Name (German) *</label>
                  <input
                    type="text"
                    value={editingProduct.name?.de || ''}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      name: { ...editingProduct.name, de: e.target.value, en: editingProduct.name?.en || '' } 
                    })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Name (English) *</label>
                  <input
                    type="text"
                    value={editingProduct.name?.en || ''}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      name: { ...editingProduct.name, en: e.target.value, de: editingProduct.name?.de || '' } 
                    })}
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Origin */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Origin (German)</label>
                  <input
                    type="text"
                    value={editingProduct.origin?.de || ''}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      origin: { ...editingProduct.origin, de: e.target.value, en: editingProduct.origin?.en || '' } 
                    })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Origin (English)</label>
                  <input
                    type="text"
                    value={editingProduct.origin?.en || ''}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      origin: { ...editingProduct.origin, en: e.target.value, de: editingProduct.origin?.de || '' } 
                    })}
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tasting Notes (German)</label>
                  <input
                    type="text"
                    value={editingProduct.notes?.de || ''}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      notes: { ...editingProduct.notes, de: e.target.value, en: editingProduct.notes?.en || '' } 
                    })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tasting Notes (English)</label>
                  <input
                    type="text"
                    value={editingProduct.notes?.en || ''}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      notes: { ...editingProduct.notes, en: e.target.value, de: editingProduct.notes?.de || '' } 
                    })}
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Description */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Description (German)</label>
                <textarea
                  value={editingProduct.description?.de || ''}
                  onChange={(e) => setEditingProduct({ 
                    ...editingProduct, 
                    description: { ...editingProduct.description, de: e.target.value, en: editingProduct.description?.en || '' } 
                  })}
                  className={styles.input}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Description (English)</label>
                <textarea
                  value={editingProduct.description?.en || ''}
                  onChange={(e) => setEditingProduct({ 
                    ...editingProduct, 
                    description: { ...editingProduct.description, en: e.target.value, de: editingProduct.description?.de || '' } 
                  })}
                  className={styles.input}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Price & Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Base Price (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={((editingProduct.basePrice || 0) / 100).toFixed(2)}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      basePrice: Math.round(parseFloat(e.target.value || '0') * 100) 
                    })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Stock Quantity</label>
                  <input
                    type="number"
                    value={editingProduct.stockQuantity ?? 100}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      stockQuantity: parseInt(e.target.value) || 0 
                    })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Low Stock Threshold</label>
                  <input
                    type="number"
                    value={editingProduct.lowStockThreshold ?? 10}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      lowStockThreshold: parseInt(e.target.value) || 10 
                    })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Badge</label>
                  <select
                    value={editingProduct.badge || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value || null })}
                    className={styles.select}
                  >
                    <option value="">No Badge</option>
                    <option value="bestseller">Bestseller</option>
                    <option value="new">New</option>
                    <option value="sale">Sale</option>
                  </select>
                </div>
              </div>

              {/* Image */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Product Image</label>
                
                {/* Image Preview */}
                {editingProduct.image && (
                  <div style={{ marginBottom: 12, position: 'relative', width: 'fit-content' }}>
                    <img 
                      src={editingProduct.image} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: 200, 
                        maxHeight: 200, 
                        borderRadius: 8,
                        border: '1px solid #e5e7eb'
                      }} 
                    />
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, image: null })}
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Upload Button */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <label 
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    style={{ 
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      opacity: uploading ? 0.6 : 1,
                    }}
                  >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    or enter URL:
                  </span>
                </div>

                {/* Manual URL Input */}
                <input
                  type="text"
                  value={editingProduct.image || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value || null })}
                  className={styles.input}
                  placeholder="/images/coffee/products/filename.png"
                />
              </div>

              {/* Variants */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Variants</h3>
                  <button
                    type="button"
                    onClick={addVariant}
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                  >
                    + Variant
                  </button>
                </div>

                {editingProduct.variants?.map((variant, index) => (
                  <div 
                    key={variant.id || variant._tempId} 
                    style={{ 
                      background: '#f9fafb', 
                      padding: 12, 
                      borderRadius: 8, 
                      marginBottom: 8,
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 100px 100px auto',
                      gap: 12,
                      alignItems: 'end',
                    }}
                  >
                    <div>
                      <label className={styles.label} style={{ fontSize: '0.75rem' }}>Name (DE)</label>
                      <input
                        type="text"
                        value={variant.name?.de || variant.nameDe || ''}
                        onChange={(e) => updateVariant(index, 'name.de', e.target.value)}
                        className={styles.input}
                        style={{ padding: '6px 10px', fontSize: '0.875rem' }}
                      />
                    </div>
                    <div>
                      <label className={styles.label} style={{ fontSize: '0.75rem' }}>Name (EN)</label>
                      <input
                        type="text"
                        value={variant.name?.en || variant.nameEn || ''}
                        onChange={(e) => updateVariant(index, 'name.en', e.target.value)}
                        className={styles.input}
                        style={{ padding: '6px 10px', fontSize: '0.875rem' }}
                      />
                    </div>
                    <div>
                      <label className={styles.label} style={{ fontSize: '0.75rem' }}>+/- Price (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={((variant.priceModifier || 0) / 100).toFixed(2)}
                        onChange={(e) => updateVariant(index, 'priceModifier', Math.round(parseFloat(e.target.value || '0') * 100))}
                        className={styles.input}
                        style={{ padding: '6px 10px', fontSize: '0.875rem' }}
                      />
                    </div>
                    <div>
                      <label className={styles.label} style={{ fontSize: '0.75rem' }}>Weight</label>
                      <input
                        type="text"
                        value={variant.weight || ''}
                        onChange={(e) => updateVariant(index, 'weight', e.target.value)}
                        className={styles.input}
                        style={{ padding: '6px 10px', fontSize: '0.875rem' }}
                        placeholder="250g"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {(!editingProduct.variants || editingProduct.variants.length === 0) && (
                  <p style={{ color: '#666', fontSize: '0.875rem', textAlign: 'center', padding: 20 }}>
                    No variants. Click &quot;+ Variant&quot; to add one.
                  </p>
                )}
              </div>

              {/* Active Toggle */}
              <div className={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={editingProduct.active !== false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.checked })}
                  />
                  Product is active (visible in shop)
                </label>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              <button
                onClick={() => { setShowModal(false); setEditingProduct(null); }}
                className={`${styles.button} ${styles.buttonSecondary}`}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`${styles.button} ${styles.buttonPrimary}`}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
