'use client'

import { login, signup, type ActionState } from './actions'
import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat, Loader2, Mail, Lock, ArrowLeft, CheckCircle2, User } from 'lucide-react'

const initialState: ActionState = {
  error: null,
  success: false,
  message: null
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // Login Action State
  const [loginState, loginAction, isLoginPending] = useActionState(login, initialState);
  
  // Signup Action State
  const [signupState, signupAction, isSignupPending] = useActionState(signup, initialState);

  // Handle successful login
  useEffect(() => {
    if (loginState.success && mode === 'login') {
      router.refresh(); // Update server components with new session
      router.push('/'); // Navigate to home
    }
  }, [loginState.success, mode, router]);

  // Reset states when switching modes
  useEffect(() => {
    // Optional: clear errors when switching
  }, [mode]);

  if (signupState.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="w-full max-w-sm space-y-8 text-center animate-in fade-in zoom-in duration-300">
           <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-500 mb-4">
              <CheckCircle2 size={40} />
           </div>
           <h2 className="text-2xl font-bold text-white">이메일 확인 필요</h2>
           <p className="text-zinc-400 leading-relaxed">
             <span className="text-white font-bold">{signupState.message}</span><br/>
             인증 링크를 클릭하면 가입이 완료됩니다.
           </p>
           <button 
             onClick={() => window.location.reload()}
             className="mt-8 w-full rounded-sm bg-zinc-800 py-3 text-sm font-bold text-white hover:bg-zinc-700"
           >
             로그인 화면으로 돌아가기
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm bg-blue-600 mb-4 shadow-lg shadow-blue-900/50">
            <ChefHat className="text-white" size={28} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {mode === 'login' ? 'Smart Kitchen Log' : '회원가입'}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {mode === 'login' 
              ? '로그인하여 레시피와 식재료를 관리하세요.' 
              : '새로운 계정을 만들고 주방 관리를 시작하세요.'}
          </p>
        </div>

        {mode === 'login' ? (
          <form action={loginAction} className="mt-8 space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  name="email"
                  placeholder="이메일 주소"
                  required
                  className="w-full rounded-sm border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 placeholder:text-zinc-600 transition-colors"
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="password"
                  name="password"
                  placeholder="비밀번호"
                  required
                  className="w-full rounded-sm border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 placeholder:text-zinc-600 transition-colors"
                />
              </div>
            </div>

            {loginState?.error && (
              <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-sm border border-red-500/20 text-center font-medium">
                ⚠️ {loginState.error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoginPending}
              className="flex w-full items-center justify-center rounded-sm bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isLoginPending ? <Loader2 className="animate-spin" size={20} /> : '로그인'}
            </button>
            
            <div className="mt-4 text-center">
                <button 
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                    계정이 없으신가요? <span className="text-blue-500 font-bold ml-1">회원가입</span>
                </button>
            </div>
          </form>
        ) : (
          <form action={signupAction} className="mt-8 space-y-4 animate-in fade-in slide-in-from-left-8 duration-300">
             <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="text"
                  name="username"
                  placeholder="닉네임 (아이디)"
                  required
                  className="w-full rounded-sm border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 placeholder:text-zinc-600 transition-colors"
                />
              </div>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  name="email"
                  placeholder="이메일 주소 (로그인 및 찾기용)"
                  required
                  className="w-full rounded-sm border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 placeholder:text-zinc-600 transition-colors"
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="password"
                  name="password"
                  placeholder="비밀번호 (6자 이상)"
                  required
                  minLength={6}
                  className="w-full rounded-sm border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 placeholder:text-zinc-600 transition-colors"
                />
              </div>
            </div>

            {signupState?.error && (
              <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-sm border border-red-500/20 text-center font-medium">
                ⚠️ {signupState.error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSignupPending}
              className="flex w-full items-center justify-center rounded-sm bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isSignupPending ? <Loader2 className="animate-spin" size={20} /> : '회원가입 하기'}
            </button>
            
            <div className="mt-4 text-center">
                <button 
                    type="button"
                    onClick={() => setMode('login')}
                    className="flex items-center justify-center gap-1 mx-auto text-xs text-zinc-500 hover:text-white transition-colors"
                >
                    <ArrowLeft size={12} />
                    <span>로그인으로 돌아가기</span>
                </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
