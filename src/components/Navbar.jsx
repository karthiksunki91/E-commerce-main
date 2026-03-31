"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import SearchBar from '@/components/SearchBar';

export default function Navbar() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get initial session
    const fetchSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (profile?.role === 'admin') {
          setIsAdmin(true);
        }
      } else {
        setIsAdmin(false);
      }
    };

    fetchSessionAndRole();

    // Listen for auth changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        fetchSessionAndRole();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileOpen(false);
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="glass sticky top-0 z-50 w-full transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="font-extrabold text-2xl tracking-tighter text-primary flex items-center gap-2 group">
            <span className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              E
            </span>
            <span>Commerce</span>
          </Link>
          
          {/* Main Nav Actions */}
          <div className="flex items-center gap-6">
            
            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/" className={`${pathname === '/' ? 'text-primary' : 'text-gray-600 dark:text-gray-300'} hover:text-primary transition-colors`}>
                Home
              </Link>
              {isAdmin && (
                <Link href="/admin" className={`${pathname.startsWith('/admin') ? 'text-primary' : 'text-gray-600 dark:text-gray-300'} hover:text-primary transition-colors`}>
                  Admin Panel
                </Link>
              )}
            </div>

            <SearchBar />

            {/* Cart Icon */}
            <Link 
              href="/cart" 
              className="relative text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </Link>

            {session ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 p-1.5 rounded-full transition-colors border border-transparent shadow-sm hover:border-slate-200 dark:hover:border-zinc-700"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-400 text-white flex items-center justify-center font-bold text-sm shadow-inner">
                    {session.user.email?.charAt(0).toUpperCase()}
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 py-2 animate-fadeIn origin-top-right z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 truncate">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Signed in as</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{session.user.email}</p>
                    </div>
                    
                    <Link 
                      href="/profile" 
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-primary transition-colors"
                    >
                      Your Profile
                    </Link>
                    
                    {isAdmin && (
                      <Link 
                        href="/admin" 
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-primary transition-colors md:hidden"
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    <div className="border-t border-gray-100 dark:border-zinc-800 my-1"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="text-gray-700 dark:text-gray-200 hover:text-primary font-medium text-sm transition-colors"
                >
                  Log in
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-full font-medium text-sm hover:bg-primary dark:hover:bg-primary hover:text-white transition-all shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Click outside to close backdrop mobile overlay logic can go here if needed */}
      {isProfileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setIsProfileOpen(false)}
        />
      )}
    </nav>
  );
}
