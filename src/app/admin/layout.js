"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Spinner from '@/components/Spinner';

export default function AdminLayout({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin') {
          router.push('/'); // Not an admin
          return;
        }
        setIsAdmin(true);

      } catch (err) {
        console.error("Admin check error:", err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Spinner size="lg" />
      </main>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-zinc-950 w-full animate-fadeIn">
      {/* Sidebar acts as left navigation on desktop */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="flex-grow w-full md:max-w-[calc(100%-16rem)] overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
