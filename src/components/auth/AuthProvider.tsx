'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { createClient } from '@/utils/supabase/client';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, user, checkUser } = useAuthStore();
  const [isMounting, setIsMounting] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // 1. 초기 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
          } else {
            setUser(null);
          }
          setIsMounting(false); // 초기 로딩 완료
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (mounted) setIsMounting(false);
      }
    };

    initAuth();

    // 2. 실시간 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setIsMounting(false); // 이벤트 발생 시에도 로딩 해제
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, supabase]);

  // 리다이렉트 로직
  useEffect(() => {
    if (isMounting) return; // 로딩 중엔 아무것도 안 함

    // 1. 로그인이 필요한 페이지인데 로그인이 안 된 경우 -> 로그인 페이지로
    if (!user && pathname !== '/login' && !pathname.startsWith('/auth')) {
      router.replace('/login');
    } 
    // 2. 이미 로그인했는데 로그인 페이지에 있는 경우 -> 메인으로
    else if (user && pathname === '/login') {
      router.replace('/');
    }
  }, [user, isMounting, pathname, router]);

  // 로딩 중 화면 (깜빡임 방지용)
  if (isMounting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        {/* 로고 등으로 대체 가능 */}
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // 로그인 안 된 상태에서 보호된 페이지 접근 시 화면 숨김 (리다이렉트 될 때까지)
  if (!user && pathname !== '/login' && !pathname.startsWith('/auth')) {
    return null; 
  }

  return <>{children}</>;
}