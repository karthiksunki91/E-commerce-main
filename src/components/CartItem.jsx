"use client";

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice } from '@/lib/utils';

export default function CartItem({ item, onUpdate, onRemove }) {
  const [loading, setLoading] = useState(false);
  const product = item.products;

  if (!product) return null;

  const handleUpdateQuantity = async (newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > product.stock) {
      alert(`Only ${product.stock} items available in stock.`);
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', item.id);

      if (error) throw error;
      onUpdate(item.id, newQuantity);
    } catch (err) {
      console.error("Update quantity error:", err);
      alert("Failed to update quantity");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      onRemove(item.id);
    } catch (err) {
      console.error("Remove item error:", err);
      alert("Failed to remove item");
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start transition-all ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Image */}
      <Link href={`/product/${product.id}`} className="w-full sm:w-32 h-32 flex-shrink-0 bg-gray-50 dark:bg-zinc-800 rounded-xl overflow-hidden relative block">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex-grow flex flex-col w-full h-full">
        <div className="flex justify-between items-start mb-1">
          <Link href={`/product/${product.id}`} className="text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-primary transition-colors line-clamp-2 pr-4">
            {product.name}
          </Link>
          <div className="font-bold text-gray-900 dark:text-white text-lg whitespace-nowrap">
            {formatPrice(product.price)}
          </div>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
          {product.description || "No description"}
        </p>

        <div className="mt-auto flex justify-between items-center sm:items-end w-full">
          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-800">
              <button 
                onClick={() => handleUpdateQuantity(item.quantity - 1)}
                disabled={item.quantity <= 1 || loading}
                className="px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              </button>
              <span className="px-4 py-1.5 text-sm font-bold text-gray-900 dark:text-white border-x border-gray-200 dark:border-zinc-700">
                {item.quantity}
              </span>
              <button 
                onClick={() => handleUpdateQuantity(item.quantity + 1)}
                disabled={item.quantity >= product.stock || loading}
                className="px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
            
            {/* Remove */}
            <button 
              onClick={handleRemove}
              className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Remove
            </button>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Subtotal</span>
            <span className="font-bold text-xl text-primary">
              {formatPrice(item.quantity * product.price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
