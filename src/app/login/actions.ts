'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type ActionState = {
  error: string | null;
  success: boolean;
  message: string | null;
}

// 내부적으로 사용할 도메인 (사용자는 몰라도 됨)
const INTERNAL_DOMAIN = 'recipe-user.com';

function createEmailFromId(id: string) {
  // 이미 이메일 형식이면 그대로 사용, 아니면 도메인 붙이기
  return id.includes('@') ? id : `${id}@${INTERNAL_DOMAIN}`;
}

export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  // 사용자가 입력한 ID (또는 이메일)
  const userId = formData.get('username') as string
  const password = formData.get('password') as string

  const email = createEmailFromId(userId);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // 보안상 아이디/비번 중 뭐가 틀렸는지 안 알려주는 게 좋지만, 편의를 위해 메시지 전달
    return { error: '아이디 또는 비밀번호를 확인해주세요.', success: false, message: null }
  }

  revalidatePath('/', 'layout')
  return { error: null, success: true, message: null }
}

export async function signup(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const userId = formData.get('username') as string
  const password = formData.get('password') as string
  const recoveryEmail = formData.get('recovery_email') as string

  // 아이디 유효성 검사 (공백 등)
  if (!userId || userId.includes(' ')) {
    return { error: '아이디는 공백 없이 입력해주세요.', success: false, message: null }
  }

  const email = createEmailFromId(userId);

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: userId,
        display_name: userId,
        recovery_email: recoveryEmail || '', // 나중에 비밀번호 찾기에 사용
      },
    },
  })

  if (error) {
    return { error: error.message, success: false, message: null }
  }

  if (data?.user && data?.user?.identities && data?.user?.identities.length === 0) {
     return { error: '이미 사용 중인 아이디입니다.', success: false, message: null }
  }

  return { error: null, success: true, message: '가입이 완료되었습니다!' }
}