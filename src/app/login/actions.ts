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
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('username', username)
    .single()

  if (profileError || !profile) {
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
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. 아이디 중복 체크 (DB)
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single()

  if (existingUser) {
    return { error: '이미 사용 중인 아이디입니다.', success: false, message: null }
  }

  // 2. Supabase Auth 회원가입
  // 주의: 이미 존재하는 이메일이라면 Supabase가 에러를 리턴하지 않고 가짜 성공 응답을 줄 수도 있음 (보안 설정에 따라)
  // 하지만 email confirmation이 꺼져 있다면 에러를 리턴할 것임.
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: username,
      },
    },
  })

  if (error) {
    console.error('Signup Error:', error);
    // 에러 메시지가 'Anonymous sign-ins are disabled'인 경우, 이메일이 이미 존재할 가능성이 높음
    if (error.message.includes('Anonymous')) {
       return { error: '이미 가입된 이메일이거나, 회원가입 설정 오류입니다.', success: false, message: null }
    }
    return { error: error.message, success: false, message: null }
  }

  if (data?.user) {
    // 3. profiles 테이블에 아이디 매핑 저장
    // 만약 이미 Auth에는 있는데 Profile이 없는 경우(이전 시도 실패 등), insert가 성공해야 함.
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: data.user.id, username, email })
    
    if (profileError) {
      console.error('Profile creation failed:', profileError);
      // 이미 프로필이 있다면 무시 (혹시 모를 재시도)
      if (profileError.code !== '23505') { // unique violation 아님
         return { error: '프로필 생성 실패. 관리자에게 문의하세요.', success: false, message: null }
      }
    }
  } else {
      // User data가 없는 경우 (보통 이메일 인증 대기 상태일 때)
      return { error: '회원가입 요청은 되었으나 사용자 정보를 받아오지 못했습니다.', success: false, message: null }
  }

  return { error: null, success: true, message: '가입이 완료되었습니다!' }
}

import { getURL } from '@/utils/getURL';

// ... (imports)

// ... (login & signup functions)

export async function resetPassword(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const input = formData.get('input') as string;

  let email = input;

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

  const baseUrl = getURL();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}auth/reset-password`,
  });

  if (error) {
    return { error: error.message, success: false, message: null };
  }

  return { error: null, success: true, message: '비밀번호 재설정 메일을 보냈습니다.' };
}