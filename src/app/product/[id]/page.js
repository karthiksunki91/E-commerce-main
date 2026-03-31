import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';
import ProductCard from '@/components/ProductCard';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }) {
  const { id } = await params;

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return notFound();
    console.error('Error fetching product:', error);
    return (
      <main className="min-h-screen p-8 max-w-7xl mx-auto flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-xl border border-red-200 dark:border-red-900">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>Failed to load product details.</p>
        </div>
      </main>
    );
  }

  if (!product) return notFound();

  // Fetch related products (excluding current)
  const { data: relatedProducts } = await supabase
    .from('products')
    .select('*')
    .neq('id', id)
    .limit(4)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen pt-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-8 text-sm font-medium text-gray-500 dark:text-gray-400">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          </li>
          <li>
            <svg className="w-4 h-4 text-gray-400 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </li>
          <li>
            <Link href="/" className="hover:text-primary transition-colors">Products</Link>
          </li>
          <li>
            <svg className="w-4 h-4 text-gray-400 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </li>
          <li className="text-gray-900 dark:text-gray-100 truncate w-32 sm:w-auto" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Product Detail Grid */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
        
        {/* Product Image Selection */}
        <div className="flex flex-col-reverse lg:flex-row gap-4">
          <div className="w-full lg:w-4/5 flex-shrink-0 bg-gray-100 dark:bg-zinc-900 rounded-2xl overflow-hidden aspect-[4/5] relative shadow-inner">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-lg">No Image</span>
              </div>
            )}
            
            {/* Free Shipping Badge Overlay */}
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur text-gray-900 dark:text-white px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-full shadow-sm">
              Free Shipping
            </div>
          </div>
        </div>

        {/* Product Info Section */}
        <div className="mt-10 px-0 sm:px-0 lg:mt-0 lg:row-span-2">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
                {product.name}
              </h1>
              <p className="text-3xl text-primary font-bold">
                {formatPrice(product.price)}
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-zinc-800 pt-6">
              <h3 className="sr-only">Description</h3>
              <div className="text-base text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed">
                {product.description ? (
                  <p>{product.description}</p>
                ) : (
                  <p className="italic text-gray-400">No details available.</p>
                )}
              </div>
            </div>

            <div className="mt-2">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                <span className={`font-medium ${product.stock > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {product.stock > 0 ? `${product.stock} in stock - Ready to ship` : 'Out of stock'}
                </span>
              </div>
            </div>

            <div className="mt-8">
              <AddToCartButton productId={product.id} stock={product.stock} />
            </div>

            <div className="mt-8 border-t border-gray-200 dark:border-zinc-800 pt-8">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                  Free Returns
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Secure Payment
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Products Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mt-32 pt-16 border-t border-gray-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
            You might also like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

    </main>
  );
}
