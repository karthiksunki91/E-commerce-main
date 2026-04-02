"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ReviewSection({ productId, initialReviews, canReview }) {
  const [reviews, setReviews] = useState(initialReviews || []);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(!canReview); // Simple toggle down
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: reviewData, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          product_id: productId,
          rating,
          comment
        })
        .select('*, profiles(full_name)')
        .single();

      if (error) throw error;
      
      setReviews([reviewData, ...reviews]);
      setHasReviewed(true);
      router.refresh(); // so parent server components re-fetch stars
    } catch (err) {
      console.error(err);
      alert("Failed to post review. You might have already reviewed this product.");
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : 0;

  return (
    <section className="mt-16 pt-12 border-t border-gray-200 dark:border-zinc-800 animate-fadeIn">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
        Customer Reviews
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Summary side */}
        <div>
          <div className="bg-gray-50 dark:bg-zinc-900 rounded-3xl p-8 text-center border border-gray-100 dark:border-zinc-800">
            <div className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2">
              {avgRating} <span className="text-2xl text-gray-400">/ 5</span>
            </div>
            <div className="flex justify-center gap-1 mb-2 text-yellow-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${i < Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-200 dark:text-zinc-700'}`}>
                   <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                </svg>
              ))}
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {!hasReviewed && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Write a Review</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${rating >= star ? 'bg-yellow-400 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:bg-yellow-100'}`}
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" /></svg>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Review</label>
                  <textarea 
                    rows="4" required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm resize-none"
                    placeholder="Tell us what you think..."
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 px-6 rounded-xl hover:bg-primary dark:hover:bg-primary transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-6">
          {reviews.length === 0 ? (
            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-3xl p-12 text-center text-gray-500 border border-gray-100 dark:border-zinc-800 border-dashed">
              No reviews yet. Be the first to review this!
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-800 text-gray-700 dark:text-gray-300 flex items-center justify-center font-bold">
                      {r.profiles?.full_name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white leading-tight">
                        {r.profiles?.full_name || 'Anonymous User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${i < r.rating ? 'text-yellow-400' : 'text-gray-200 dark:text-zinc-700'}`}>
                         <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  {r.comment}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
