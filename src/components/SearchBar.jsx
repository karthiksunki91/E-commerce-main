"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const initialUpdate = useRef(true);

  // Sync query when URL changes (e.g. back button or clearing filters)
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Handle Debounce
  useEffect(() => {
    if (initialUpdate.current) {
      initialUpdate.current = false;
      return;
    }

    const handler = setTimeout(() => {
      // Don't push if the url param is already equal to query
      if ((searchParams.get('q') || '') === query) return;

      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
      router.push(`/products?${params.toString()}`);
    }, 400);

    return () => clearTimeout(handler);
  }, [query]); // only trigger when local query state changes

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    router.push(`/products?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-sm hidden md:block group">
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-slate-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-full pl-5 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent shadow-sm hover:shadow-md dark:border-zinc-700"
      />
      <button 
        type="submit" 
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </button>
    </form>
  );
}

export default function SearchBar() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm hidden md:block h-10"></div>}>
      <SearchInput />
    </Suspense>
  );
}
