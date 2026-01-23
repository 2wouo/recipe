'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type ActionState = {
  error: string | null;
  success: boolean;
  message: string | null;
}

export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message, success: false, message: null }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message, success: false, message: null }
  }

  if (data?.user && data?.user?.identities && data?.user?.identities.length === 0) {
     return { error: '이미 가입된 이메일입니다.', success: false, message: null }
  }

  return { error: null, success: true, message: '가입 확인 이메일이 발송되었습니다. 메일함을 확인해주세요!' }
}
