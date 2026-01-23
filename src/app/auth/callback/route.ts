import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getURL } from '@/utils/getURL'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  
  // Base URL for redirection
  const baseUrl = getURL()

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Clean up the URL. Next param might start with /
      const cleanNext = next.startsWith('/') ? next.substring(1) : next
      return NextResponse.redirect(`${baseUrl}${cleanNext}`)
    }
  }

  // Error case
  return NextResponse.redirect(`${baseUrl}login?error=Authentication Failed`)
}
