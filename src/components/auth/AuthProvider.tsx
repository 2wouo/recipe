'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { createClient } from '@/utils/supabase/client';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, user, loading, checkUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkUser();
      } catch (error) {
        console.error('Auth initialization error:', error);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [checkUser, setUser]);

  // Client-side redirection disabled to prevent loops.
  // Access control is managed by server-side middleware (if enabled) or RLS policies.
  /*
  useEffect(() => {
    console.log('Auth Status - User:', !!user, 'Loading:', loading, 'Path:', pathname);
    if (!loading) {
      if (!user && pathname !== '/login') {
        console.log('Redirecting to /login');
        router.replace('/login');
      } else if (user && pathname === '/login') {
        console.log('Redirecting to /');
        router.replace('/');
      }
    }
  }, [user, loading, pathname, router]);
  */

  // Allow rendering even if loading or not logged in
  /*
  if (loading && pathname !== '/login') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    return null;
  }
  */

  return <>{children}</>;
}