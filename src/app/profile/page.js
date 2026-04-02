"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/Spinner';
import { formatPrice } from '@/lib/utils';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        setProfile(user);

        // Fetch user orders with relation tracking
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id, total_price, status, created_at, address,
            order_items (
              id, quantity, price,
              products ( id, name, image_url )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);
        
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndOrders();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleCancelOrder = async (orderId, orderItems) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      setLoading(true);
      const { error: cancelError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (cancelError) throw cancelError;

      // Restore stock
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          if (!item.products?.id) continue;
          
          const { data: currentProduct } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.products.id)
            .single();
            
          if (currentProduct) {
            await supabase
              .from('products')
              .update({ stock: currentProduct.stock + item.quantity })
              .eq('id', item.products.id);
          }
        }
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      alert('Order cancelled successfully.');
    } catch (err) {
      console.error('Cancellation error:', err);
      alert('Failed to cancel order. Database might restrict this status change without schema updates.');
    } finally {
      setLoading(false);
    }
  };

  const statusMap = {
    'pending': 1,
    'confirmed': 2,
    'shipped': 3,
    'delivered': 4,
    'cancelled': -1
  };

  if (loading) {
    return (
      <main className="min-h-[80vh] flex flex-col items-center justify-center p-8">
        <Spinner size="lg" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[80vh] p-8 max-w-7xl mx-auto flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200">
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 pt-12 max-w-7xl mx-auto animate-fadeIn">
      {/* Profile Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-blue-400 text-white flex items-center justify-center text-4xl font-bold shadow-lg shadow-primary/30">
            {profile?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">My Profile</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{profile?.email}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold py-3 px-8 rounded-xl transition-colors shadow-sm"
        >
          Sign Out
        </button>
      </div>

      {/* Orders Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Order History</h2>
        
        {orders.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-gray-300 mx-auto mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">When you buy something, your orders will appear here.</p>
            <button 
              onClick={() => router.push('/')}
              className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary-hover transition-colors shadow-md"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const currentStep = statusMap[order.status] || 0;
              const isCancelled = order.status === 'cancelled';
              
              return (
                <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
                  <div className="bg-gray-50 dark:bg-zinc-950 p-6 border-b border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Order Placed</p>
                        <p className="font-bold text-gray-900 dark:text-white">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Total</p>
                        <p className="font-bold text-gray-900 dark:text-white">{formatPrice(order.total_price)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Order ID</p>
                        <p className="font-mono font-bold text-gray-900 dark:text-white">#{order.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    {(!isCancelled && (order.status === 'pending' || order.status === 'confirmed')) && (
                      <button 
                        onClick={() => handleCancelOrder(order.id, order.order_items)}
                        className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 font-bold py-2 px-4 rounded-lg transition-colors border border-red-100 dark:border-red-900/50"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                  
                  <div className="p-6 md:p-8">
                    {/* Items display */}
                    <div className="space-y-4 mb-8">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                            {item.products?.image_url ? (
                              <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center text-gray-400">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                               </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{item.products?.name}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress Tracker */}
                    <div className="relative mt-10 mb-4 px-4">
                      {isCancelled ? (
                        <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/20">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-lg">This order was cancelled</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <h4 className="font-bold text-lg mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                             Status: <span className="capitalize text-primary">{order.status}</span>
                          </h4>
                          <div className="flex items-center justify-between relative">
                            {/* Background Line */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full z-0"></div>
                            
                            {/* Fill Line */}
                            <div 
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-primary rounded-full z-0 transition-all duration-500"
                              style={{ width: `${(Math.max(0, currentStep - 1) / 3) * 100}%` }}
                            ></div>
                            
                            {/* Step Dots */}
                            {['Pending', 'Confirmed', 'Shipped', 'Delivered'].map((step, idx) => {
                              const stepNum = idx + 1;
                              const isActive = currentStep >= stepNum;
                              return (
                                <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-colors duration-300
                                    ${isActive ? 'bg-primary border-white dark:border-zinc-900 text-white' : 'bg-gray-200 dark:bg-zinc-800 border-white dark:border-zinc-900 text-transparent'}`}
                                  >
                                    {isActive && (
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                  <span className={`text-xs md:text-sm font-bold absolute top-10 whitespace-nowrap ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
