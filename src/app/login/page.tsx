'use client'

import { login, signup } from './actions'
import { useActionState } from 'react'
import { ChefHat, Loader2, Mail, Lock } from 'lucide-react'

const initialState = {
  error: null as string | null,
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(async (_: any, formData: FormData) => {
    const action = formData.get('action')
    if (action === 'signup') {
      return await signup(formData)
    }
    return await login(formData)
  }, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm bg-blue-600 mb-4">
            <ChefHat className="text-white" size={28} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Smart Kitchen Log</h2>
          <p className="mt-2 text-sm text-zinc-400">
            로그인하여 레시피와 식재료를 관리하세요.
          </p>
        </div>

        <form action={formAction} className="mt-8 space-y-4">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input
                type="email"
                name="email"
                placeholder="이메일 주소"
                required
                className="w-full rounded-sm border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 placeholder:text-zinc-500"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input
                type="password"
                name="password"
                placeholder="비밀번호"
                required
                className="w-full rounded-sm border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 placeholder:text-zinc-500"
              />
            </div>
          </div>

          {state?.error && (
            <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded-sm border border-red-500/20 text-center">
              {state.error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              name="action"
              value="login"
              disabled={isPending}
              className="flex w-full items-center justify-center rounded-sm bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 className="animate-spin" size={20} /> : '로그인'}
            </button>
            <button
              type="submit"
              name="action"
              value="signup"
              disabled={isPending}
              className="flex w-full items-center justify-center rounded-sm border border-zinc-700 bg-transparent py-2.5 text-sm font-bold text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 className="animate-spin" size={20} /> : '회원가입'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}