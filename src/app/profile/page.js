"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/Spinner';

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

        // Fetch user orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
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
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                <thead className="bg-gray-50 dark:bg-zinc-950">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="font-mono text-sm text-gray-900 dark:text-gray-300">#{order.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-4 py-1.5 inline-flex text-xs font-bold rounded-full capitalize
                          ${order.status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-extrabold text-gray-900 dark:text-white">
                        ${Number(order.total_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
