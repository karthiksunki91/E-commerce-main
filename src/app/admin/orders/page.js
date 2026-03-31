"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Spinner from '@/components/Spinner';
import { formatPrice } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            user_id,
            total_price,
            status,
            created_at,
            address,
            order_items (
              id,
              quantity,
              price,
              products (
                id,
                name
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(data || []);
      } catch (err) {
        console.error("Fetch orders error:", err);
        setError("Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId, currentStatus) => {
    let newStatus = 'pending';
    if (currentStatus === 'pending') newStatus = 'shipped';
    else if (currentStatus === 'shipped') newStatus = 'delivered';
    else return; // delivered is final state

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update order status.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 md:p-12 w-full animate-fadeIn">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Orders Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track and update customer orders.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-200">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border border-gray-100 dark:border-zinc-800 text-center text-gray-500">
          No orders have been placed yet.
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
              <thead className="bg-gray-50 dark:bg-zinc-950">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order / User</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items Summary</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <div className="font-mono text-xs font-bold text-gray-900 dark:text-white truncate w-32 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded inline-block" title={order.id}>#{order.id.slice(0, 8)}...</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate w-32" title={order.user_id}>User: {order.user_id.substring(0,8)}...</div>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-600 dark:text-gray-300 max-w-xs">
                      <p className="truncate font-medium">
                        {order.order_items?.map(oi => `${oi.quantity}x ${oi.products?.name || 'Unknown'}`).join(', ')}
                      </p>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-extrabold text-gray-900 dark:text-white">
                      {formatPrice(order.total_price)}
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
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      {order.status !== 'delivered' ? (
                        <button
                          onClick={() => updateOrderStatus(order.id, order.status)}
                          className="text-primary hover:text-white border border-primary hover:bg-primary px-4 py-2 rounded-xl transition-colors font-bold shadow-sm inline-block"
                        >
                          Mark as {order.status === 'pending' ? 'Shipped' : 'Delivered'}
                        </button>
                      ) : (
                        <span className="text-green-600 font-bold px-4 py-2 flex items-center justify-end gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
