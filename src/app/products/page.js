import { supabase } from '@/lib/supabaseClient';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }) {
  const awaitedParams = await searchParams;
  const q = awaitedParams?.q || '';
  const category = awaitedParams?.category || '';
  const minPrice = awaitedParams?.minPrice || '';
  const maxPrice = awaitedParams?.maxPrice || '';
  const sort = awaitedParams?.sort || '';

  // 1. Fetch Categories for Filter Sidebar
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (catError) {
    console.error('Error fetching categories:', catError);
  }

  // 2. Build Products Query
  let query = supabase.from('products').select('*');

  // Filters
  if (q) {
    query = query.ilike('name', `%${q}%`);
  }
  
  if (category) {
    query = query.eq('category_id', category);
  }

  if (minPrice && !isNaN(minPrice)) {
    query = query.gte('price', parseFloat(minPrice));
  }

  if (maxPrice && !isNaN(maxPrice)) {
    query = query.lte('price', parseFloat(maxPrice));
  }

  // Sorting
  switch (sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    default:
      // Featured / Default logic
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Execute Query
  const { data: products, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return (
      <main className="min-h-screen p-8 max-w-7xl mx-auto flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-200 dark:border-red-900/50 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-lg font-bold">Failed to load products.</p>
          <p className="text-sm mt-1 opacity-80">Please try again later.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20 pt-8 w-full bg-gray-50 dark:bg-zinc-950 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumbs & Title */}
        <div className="mb-8">
          <nav className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="text-gray-300 dark:text-zinc-700">/</span>
            <span className="text-gray-900 dark:text-gray-100">Products</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
            {q ? `Search results for "${q}"` : 'All Products'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Showing {products?.length || 0} results {q ? 'matching your search' : ''}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Filter Sidebar */}
          <FilterSidebar categories={categories} />

          {/* Product Grid */}
          <div className="flex-1 w-full relative min-h-[50vh]">
            {(!products || products.length === 0) ? (
              <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-300 dark:border-zinc-700 shadow-sm flex flex-col items-center justify-center h-full animate-fadeIn transition-all">
                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No products found</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-center mb-8">
                  We couldn't find anything matching your current filters. Try adjusting your search query or selecting a different category.
                </p>
                <div className="mt-2">
                  <Link href="/products" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold py-3 px-8 rounded-full transition-all shadow-md hover:shadow-lg inline-block">
                    Clear all filters
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 gap-y-10">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
