'use client'

import { login, signup, resetPassword, type ActionState } from './actions'
import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat, Loader2, Mail, Lock, ArrowLeft, CheckCircle2, User, KeyRound } from 'lucide-react'

const initialState: ActionState = {
  error: null,
  success: false,
  message: null
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  
  const [loginState, loginAction, isLoginPending] = useActionState(login, initialState);
  const [signupState, signupAction, isSignupPending] = useActionState(signup, initialState);
  const [resetState, resetAction, isResetPending] = useActionState(resetPassword, initialState);

  useEffect(() => {
    if (loginState.success && mode === 'login') {
      window.location.href = '/'; 
    }
    if (signupState.success && mode === 'signup') {
        window.location.href = '/'; 
    }
  }, [loginState.success, signupState.success, mode]);

  // 비밀번호 찾기 화면
  if (mode === 'reset') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">비밀번호 찾기</h2>
            <p className="mt-2 text-sm text-zinc-400">
              가입하신 아이디 또는 이메일을 입력하세요.
            </p>
          </div>

          {resetState.success ? (
             <div className="text-center space-y-4 animate-in fade-in zoom-in">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                    <CheckCircle2 size={32} />
                </div>
                <p className="text-white font-medium">{resetState.message}</p>
                <button onClick={() => setMode('login')} className="text-sm text-blue-500 hover:text-blue-400">로그인으로 돌아가기</button>
             </div>
          ) : (
            <form action={resetAction} className="mt-8 space-y-4">
                <div className="relative group">
                    <User className="absolute left-3 top-3 text-zinc-500" size={18} />
                    <input
                    type="text"
                    name="input"
                    placeholder="아이디 또는 이메일"
                    required
                    className="w-full rounded-sm border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 placeholder:text-zinc-600 transition-colors"
                    />
                </div>
                {resetState.error && <p className="text-xs text-red-500 text-center">{resetState.error}</p>}
                <button
                    type="submit"
                    disabled={isResetPending}
                    className="flex w-full items-center justify-center rounded-sm bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {isResetPending ? <Loader2 className="animate-spin" size={20} /> : '재설정 메일 보내기'}
                </button>
                <button type="button" onClick={() => setMode('login')} className="w-full text-xs text-zinc-500 hover:text-white py-2">취소</button>
            </form>
          )}
        </div>
      </div>
    )
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
            {mode === 'login' ? '아이디로 로그인하세요.' : '아이디와 이메일로 계정을 만드세요.'}
          </p>
        </div>

        {mode === 'login' ? (
          <form action={loginAction} className="mt-8 space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="text"
                  name="username"
                  placeholder="아이디"
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
            
            <div className="mt-4 flex flex-col gap-2 text-center">
                <button 
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    비밀번호를 잊으셨나요?
                </button>
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
                  placeholder="사용할 아이디"
                  required
                  pattern="[a-zA-Z0-9_]+"
                  title="영문, 숫자, 언더바(_)만 입력 가능합니다"
                  className="w-full rounded-sm border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 placeholder:text-zinc-600 transition-colors"
                />
              </div>
              
              <div className="relative group">
                <Mail className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  name="email"
                  placeholder="실제 이메일 (비밀번호 찾기용)"
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
