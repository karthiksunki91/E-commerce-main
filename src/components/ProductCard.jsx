import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

export default async function ProductCard({ product }) {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', product.id);

  const avgRating = reviews?.length 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length)
    : 0;
  return (
    <Link 
      href={`/product/${product.id}`}
      className="group relative flex flex-col bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Product Image Section */}
      <div className="relative w-full aspect-[4/5] bg-gray-50 dark:bg-zinc-800 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:scale-105 transition-transform duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2 opacity-50">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <span className="text-sm font-medium">No Image</span>
          </div>
        )}
        
        {/* Quick Add Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10 flex justify-center">
          <span className="bg-primary text-white text-sm font-semibold py-2 px-6 rounded-full shadow-lg hover:bg-primary-hover backdrop-blur-md">
            View Details
          </span>
        </div>
        
        {/* Gradient overlays for bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Product Info Section */}
      <div className="p-5 flex flex-col flex-grow relative z-20 bg-white dark:bg-zinc-900">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h2>
        
        {product.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 mb-3">
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg 
              key={i} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className={`w-4 h-4 ${i < Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-200 dark:text-zinc-700'}`}
            >
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
            </svg>
          ))}
          {reviews?.length > 0 && (
            <span className="text-xs text-gray-500 ml-1">({reviews.length})</span>
          )}
        </div>
        
        <div className="mt-auto pt-2 flex items-center justify-between">
          <p className="text-xl font-extrabold text-gray-900 dark:text-white">
            {formatPrice(product.price)}
          </p>
          
          {/* Stock Badges directly on card */}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-md">
              Only {product.stock} left
            </span>
          )}
          {product.stock === 0 && (
            <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-md">
              Out of stock
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
