"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FilterSidebar({ categories }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  
  // Sync state if URL changes outside this component
  useEffect(() => {
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
  }, [searchParams]);

  const updateFilters = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');
    
    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');
    
    router.push(`/products?${params.toString()}`);
  };

  const currentCategory = searchParams.get('category');
  const currentSort = searchParams.get('sort');

  const clearFilters = () => {
    // Keep 'q' if it exists
    const q = searchParams.get('q');
    if (q) {
      router.push(`/products?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/products');
    }
  };

  const hasActiveFilters = currentCategory || searchParams.get('minPrice') || searchParams.get('maxPrice') || currentSort;

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium bg-white dark:bg-zinc-900 shadow-sm w-full justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          {isMobileMenuOpen ? 'Hide Filters' : 'Show Filters'} {hasActiveFilters && !isMobileMenuOpen ? '(Active)' : ''}
        </button>
      </div>

      {/* Sidebar Content */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0 space-y-8 mb-8 md:mb-0 bg-white dark:bg-zinc-900/50 p-6 md:p-0 rounded-2xl md:bg-transparent md:dark:bg-transparent border border-gray-100 dark:border-zinc-800 md:border-transparent h-fit`}>
        
        {/* Header / Clear */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Filters</h3>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-sm font-medium text-primary hover:text-primary-hover hover:underline transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Sort */}
        <div>
          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-200 mb-3 uppercase tracking-wider text-xs">Sort By</h4>
          <select 
            value={currentSort || ''}
            onChange={(e) => updateFilters('sort', e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
          >
            <option value="">Featured</option>
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Categories */}
        <div className="border-t border-gray-200 dark:border-zinc-800 pt-6">
          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-200 mb-3 uppercase tracking-wider text-xs">Categories</h4>
          <div className="space-y-1.5">
            <button
              onClick={() => updateFilters('category', '')}
              className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                !currentCategory 
                  ? 'bg-primary/10 text-primary font-bold' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All Categories
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateFilters('category', cat.id)}
                className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  currentCategory === cat.id
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="border-t border-gray-200 dark:border-zinc-800 pt-6">
          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-200 mb-3 uppercase tracking-wider text-xs">Price Range</h4>
          <form onSubmit={handlePriceApply} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min="0"
                  className="w-full pl-7 pr-2 py-2 text-sm border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                />
              </div>
              <span className="text-gray-400">-</span>
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                  className="w-full pl-7 pr-2 py-2 text-sm border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full bg-slate-900 hover:bg-primary dark:bg-white dark:text-slate-900 dark:hover:bg-primary dark:hover:text-white text-white py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              Apply Filter
            </button>
          </form>
        </div>

      </div>
    </>
  );
}
