'use client';

import { useState, useEffect } from 'react';
import { useBrand } from '@/hooks/useBrand';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import FreshnessPromise from '@/components/home/FreshnessPromise';
import Story from '@/components/home/Story';
import Process from '@/components/home/Process';
import Testimonials from '@/components/home/Testimonials';
import Newsletter from '@/components/home/Newsletter';
import ProductGrid from '@/components/products/ProductGrid';
import CartDrawer from '@/components/cart/CartDrawer';

// Product type for API response
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
  image: string | null;
  badge: string | null;
  averageRating: number | null;
  reviewCount: number | null;
  variants: Array<{
    id: string;
    name: { en: string; de: string };
    priceModifier: number;
    weight: string | null;
  }>;
}

export default function HomePage() {
  const { brand } = useBrand();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`/api/products?brand=${brand.id}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    }
    
    fetchProducts();
  }, [brand.id]);

  return (
    <div className={`theme-${brand.id}`}>
      <Navigation onCartClick={() => setIsCartOpen(true)} />
      
      <main>
        <Hero />
        <FreshnessPromise />
        <ProductGrid products={products} />
        <Story />
        <Process />
        <Testimonials />
        <Newsletter />
      </main>

      <Footer />
      
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
