'use client'

import { updatePassword, type ActionState } from './actions'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, CheckCircle2 } from 'lucide-react'

const initialState: ActionState = {
  error: null,
  success: false,
  message: null
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);

  useEffect(() => {
    if (state.success) {
      // 3초 후 로그인 페이지로 이동
      const timer = setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  if (state.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="w-full max-w-sm text-center space-y-4 animate-in fade-in zoom-in">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">비밀번호 변경 완료</h2>
            <p className="text-zinc-400">
                비밀번호가 성공적으로 변경되었습니다.<br/>
                잠시 후 로그인 페이지로 이동합니다.
            </p>
            <button 
                onClick={() => window.location.href = '/login'}
                className="text-sm text-blue-500 hover:text-blue-400 mt-4"
            >
                지금 로그인하기
            </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">새 비밀번호 설정</h2>
          <p className="mt-2 text-sm text-zinc-400">
            새로운 비밀번호를 입력해주세요.
          </p>
        </div>

        <form action={formAction} className="mt-8 space-y-4">
          <div className="space-y-4">
            <div className="relative group">
              <Lock className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="password"
                name="password"
                placeholder="새 비밀번호 (6자 이상)"
                required
                minLength={6}
                className="w-full rounded-sm border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 placeholder:text-zinc-600 transition-colors"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="password"
                name="confirmPassword"
                placeholder="새 비밀번호 확인"
                required
                minLength={6}
                className="w-full rounded-sm border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 placeholder:text-zinc-600 transition-colors"
              />
            </div>
          </div>

          {state?.error && (
            <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-sm border border-red-500/20 text-center font-medium">
              ⚠️ {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center rounded-sm bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {isPending ? <Loader2 className="animate-spin" size={20} /> : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  )
}
