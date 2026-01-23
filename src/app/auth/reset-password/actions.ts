'use server'

import { createClient } from '@/utils/supabase/server'

export type ActionState = {
  error: string | null;
  success: boolean;
  message: string | null;
}

export async function updatePassword(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: '비밀번호가 일치하지 않습니다.', success: false, message: null }
  }

  if (password.length < 6) {
    return { error: '비밀번호는 6자리 이상이어야 합니다.', success: false, message: null }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return { error: error.message, success: false, message: null }
  }

  return { error: null, success: true, message: '비밀번호가 변경되었습니다.' }
}