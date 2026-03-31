"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Spinner from '@/components/Spinner';

export default function AdminDashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  
  // Metrics
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);

        const [
          { count: productCount, error: productError },
          { count: orderCount, data: orders, error: orderError },
          { count: userCount, error: userError }
        ] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('total_price', { count: 'exact' }),
          supabase.from('profiles').select('*', { count: 'exact', head: true })
        ]);

        if (productError) console.error(productError);
        if (orderError) console.error(orderError);
        if (userError) console.error(userError);

        const revenue = orders?.reduce((acc, order) => acc + Number(order.total_price), 0) || 0;

        setMetrics({
          totalProducts: productCount || 0,
          totalOrders: orderCount || 0,
          totalRevenue: revenue,
          totalUsers: userCount || 0
        });

      } catch (err) {
        console.error("Fetch metrics error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const handleSeedData = async () => {
    if (!confirm("This will insert 15 dummy products into your database. Keep clicking this if you want more items. Proceed?")) return;
    
    setSeeding(true);
    try {
      const dummyProducts = [
        { name: "Premium Wireless Headphones", price: 299.99, stock: 50, description: "Noise-cancelling over-ear headphones with 30-hour battery life and immersive sound quality.", image_url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800&auto=format&fit=crop" },
        { name: "Minimalist Smartwatch", price: 199.50, stock: 120, description: "Sleek fitness tracker and smartwatch with heart rate monitoring and OLED display.", image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop" },
        { name: "Mechanical Keyboard", price: 149.00, stock: 0, description: "Tenkeyless mechanical keyboard with Cherry MX Red switches and customizable RGB lighting.", image_url: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop" },
        { name: "Ergonomic Office Chair", price: 349.99, stock: 15, description: "Highly adjustable ergonomic chair with lumbar support, breathable mesh back, and 4D armrests.", image_url: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=800&auto=format&fit=crop" },
        { name: "4K Action Camera", price: 249.00, stock: 45, description: "Rugged, waterproof action camera shooting 4K video at 60fps with built-in image stabilization.", image_url: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?q=80&w=800&auto=format&fit=crop" },
        { name: "Leather Messenger Bag", price: 129.99, stock: 60, description: "Handcrafted full-grain leather bag with padded laptop compartment and brass hardware.", image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop" },
        { name: "Smart Home Hub", price: 89.99, stock: 200, description: "Voice-controlled smart assistant to control lighting, security, and media across your home.", image_url: "https://images.unsplash.com/photo-1558089687-f282ffcbc126?q=80&w=800&auto=format&fit=crop" },
        { name: "Ceramic Coffee Dripper", price: 35.00, stock: 85, description: "Pour-over coffee maker crafted from high-heat ceramic for pure, clean coffee extraction.", image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop" },
        { name: "Wireless Charging Pad", price: 45.00, stock: 150, description: "Fast 15W wireless charging pad with premium fabric finish compatible with all Qi devices.", image_url: "https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?q=80&w=800&auto=format&fit=crop" },
        { name: "Noise-Isolating Earbuds", price: 149.99, stock: 3, description: "True wireless earbuds featuring advanced noise isolation, compact charging case, and rich bass.", image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop" },
        { name: "Stainless Steel Water Bottle", price: 29.50, stock: 300, description: "Double-wall vacuum insulated bottle keeping drinks cold for 24 hours or hot for 12 hours.", image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop" },
        { name: "Polarized Sunglasses", price: 85.00, stock: 40, description: "Classic wayfarer style sunglasses with 100% UV protection and glare-reducing polarized lenses.", image_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop" },
        { name: "Portable SSD 1TB", price: 119.99, stock: 75, description: "Ultra-fast external solid-state drive with USB-C connection and rugged drop-resistant design.", image_url: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=800&auto=format&fit=crop" },
        { name: "Yoga Mat with Alignment Lines", price: 65.00, stock: 110, description: "Eco-friendly, non-slip yoga mat featuring laser-etched alignment markers for perfect poses.", image_url: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?q=80&w=800&auto=format&fit=crop" },
        { name: "Chef's Knife 8-Inch", price: 110.00, stock: 25, description: "Professional grade high-carbon stainless steel chef's knife for precision chopping and slicing.", image_url: "https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=800&auto=format&fit=crop" }
      ];

      const { error } = await supabase.from('products').insert(dummyProducts);
      
      if (error) throw error;
      
      // Update count locally
      setMetrics(prev => ({
        ...prev,
        totalProducts: prev.totalProducts + dummyProducts.length
      }));
      
      alert(`Successfully added ${dummyProducts.length} dummy products!`);
      
    } catch (err) {
      console.error("Seed data error:", err);
      alert("Failed to seed database.");
    } finally {
      setSeeding(false);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <button
          onClick={handleSeedData}
          disabled={seeding}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {seeding ? (
            <Spinner size="sm" className="text-white" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          )}
          {seeding ? 'Seeding Database...' : 'Seed Dummy Products'}
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 font-medium">Total Products</h3>
          </div>
          <p className="text-4xl font-extrabold text-gray-900 dark:text-white">{metrics.totalProducts}</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 font-medium">Total Revenue</h3>
          </div>
          <p className="text-4xl font-extrabold text-gray-900 dark:text-white">${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 font-medium">Total Orders</h3>
          </div>
          <p className="text-4xl font-extrabold text-gray-900 dark:text-white">{metrics.totalOrders}</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 font-medium">Total Users</h3>
          </div>
          <p className="text-4xl font-extrabold text-gray-900 dark:text-white">{metrics.totalUsers}</p>
        </div>

      </div>

    </div>
  );
}
