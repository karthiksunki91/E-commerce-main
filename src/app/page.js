import { supabase } from '@/lib/supabaseClient';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch a limited number of featured products (e.g. 8 newest)
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) {
    console.error('Error fetching products:', error);
    return (
      <main className="min-h-screen p-8 max-w-7xl mx-auto flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-6 rounded-xl border border-red-200 dark:border-red-900 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-lg font-semibold">Failed to load products.</p>
          <p className="text-sm mt-1 opacity-80">Please check your database connection.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20 w-full animate-fadeIn">
      
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden py-24 sm:py-32 lg:py-40">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-900/40 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2940&auto=format&fit=crop" 
            alt="Hero Background" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-start">
          <span className="text-primary font-bold tracking-wider uppercase text-sm mb-4">New Collection 2026</span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-3xl leading-tight">
            Elevate Your Everyday Style.
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-xl mb-10 leading-relaxed text-shadow-sm">
            Discover our latest arrivals featuring premium quality materials, minimalist designs, and unmatched comfort.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/products" className="bg-primary hover:bg-primary-hover text-white font-semibold py-4 px-8 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 text-center">
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
              Featured Products
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              The latest and highest quality items selected just for you.
            </p>
          </div>
          
          <Link href="/products" className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-800 hover:border-primary px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-sm hover:shadow-md hover:text-primary whitespace-nowrap hidden md:inline-flex items-center gap-2">
            View All Products
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
        
        {(!products || products.length === 0) ? (
          <div className="text-center py-24 bg-gray-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-gray-300 dark:border-zinc-700 mt-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No products found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Our store is currently empty. Please check back later!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            <div className="mt-12 flex justify-center md:hidden">
              <Link href="/products" className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-800 px-6 py-3 rounded-full font-medium text-sm transition-all shadow-sm w-full text-center flex items-center justify-center gap-2">
                View All Products
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </section>
      
    </main>
  );
}
