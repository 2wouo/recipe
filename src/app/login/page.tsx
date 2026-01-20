'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { ChefHat, Loader2, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('가입 확인 이메일을 확인해주세요!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // User is synced via onAuthStateChange in AuthProvider
        router.push('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '인증에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm bg-blue-600 mb-4">
            <ChefHat className="text-white" size={28} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Smart Kitchen Log</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {isSignUp ? '계정을 생성하고 주방을 관리하세요.' : '로그인하여 레시피를 관리하세요.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="mt-8 space-y-4">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input
                type="email"
                placeholder="이메일 주소"
                required
                className="w-full rounded-sm border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input
                type="password"
                placeholder="비밀번호"
                required
                className="w-full rounded-sm border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded-sm border border-red-500/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-sm bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? '가입하기' : '로그인')}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-zinc-500 hover:text-blue-500 transition-colors"
          >
            {isSignUp ? '이미 계정이 있나요? 로그인하기' : '계정이 없으신가요? 회원가입'}
          </button>
        </div>
      </div>
    </div>
  );
}
