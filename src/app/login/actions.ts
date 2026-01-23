'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type ActionState = {
  error: string | null;
  success: boolean;
  message: string | null;
}

export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const username = formData.get('username') as string
  const password = formData.get('password') as string

  // 1. 아이디로 이메일 찾기
  // profiles 테이블은 RLS 정책에 의해 누구나 조회 가능해야 함 (또는 서비스 키 사용)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('username', username)
    .single()

  if (profileError || !profile) {
    // 아이디가 없으면 에러
    return { error: '존재하지 않는 아이디입니다.', success: false, message: null }
  }

  // 2. 찾은 이메일로 로그인
  const { error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  })

  if (error) {
    return { error: '비밀번호가 일치하지 않습니다.', success: false, message: null }
  }

  revalidatePath('/', 'layout')
  return { error: null, success: true, message: null }
}

export async function signup(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const username = formData.get('username') as string
  const email = formData.get('email') as string // 진짜 이메일
  const password = formData.get('password') as string

  // 아이디 중복 체크
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single()

  if (existingUser) {
    return { error: '이미 사용 중인 아이디입니다.', success: false, message: null }
  }

  // 1. Supabase Auth 회원가입 (진짜 이메일 사용)
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: username,
        username,
      },
    },
  })

  if (error) {
    return { error: error.message, success: false, message: null }
  }

  if (data?.user) {
    // 2. profiles 테이블에 아이디 매핑 저장
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: data.user.id, username, email })
    
    if (profileError) {
      console.error('Profile creation failed:', profileError);
      // 심각한 에러지만, Auth는 성공했으므로 일단 넘어갈 수도 있음.
      // 하지만 로그인이 안 되므로 에러 처리하는 게 맞음.
      return { error: '계정 생성 중 오류가 발생했습니다. 관리자에게 문의하세요.', success: false, message: null }
    }
  }

  // 이메일 인증이 꺼져있다면 바로 로그인됨
  return { error: null, success: true, message: '가입이 완료되었습니다!' }
}

// 비밀번호 찾기 (이메일 발송)
export async function resetPassword(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const input = formData.get('input') as string; // 아이디 또는 이메일

  let email = input;

  // 입력값이 이메일 형식이 아니라면 아이디로 간주하고 이메일 찾기
  if (!input.includes('@')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', input)
      .single();
    
    if (!profile) {
      return { error: '가입된 정보를 찾을 수 없습니다.', success: false, message: null };
    }
    email = profile.email;
  }

  // 비밀번호 재설정 메일 발송
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message, success: false, message: null };
  }

  return { error: null, success: true, message: '비밀번호 재설정 메일을 보냈습니다.' };
}
