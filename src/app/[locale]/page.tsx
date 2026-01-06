'use client';

import { useState } from 'react';
import { useBrand } from '@/hooks/useBrand';
import { getProductsByBrand } from '@/config/products';
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

export default function HomePage() {
  const { brand } = useBrand();
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const products = getProductsByBrand(brand.id);

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
