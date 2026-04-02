"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AddToCartButton({ productId, stock }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/login');
        return;
      }

      const userId = user.id;

      const { data: existingCartItem, error: fetchError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking cart:", fetchError);
        alert("Failed to add to cart.");
        return;
      }

      if (existingCartItem) {
        const newQuantity = existingCartItem.quantity + 1;
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingCartItem.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: userId,
            product_id: productId,
            quantity: 1
          });

        if (insertError) throw insertError;
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      router.refresh(); // Refresh to update cart badge if any
      
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("An error occurred while adding to cart.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <button 
        disabled
        className="w-full bg-green-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transform transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Added to Cart!
      </button>
    );
  }

  if (stock <= 0) {
    return (
      <button 
        disabled
        className="w-full bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 font-bold py-4 px-8 rounded-xl cursor-not-allowed flex items-center justify-center gap-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        Out of Stock
      </button>
    );
  }

  return (
    <button 
      onClick={handleAddToCart}
      disabled={loading}
      className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 origin-center"
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Adding...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          Add to Cart
        </>
      )}
    </button>
  );
}
