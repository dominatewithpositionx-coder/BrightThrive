import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const allCookies = req.cookies.getAll();
  const cookieNames = allCookies.map(c => c.name);
  const sbCookies = cookieNames.filter(n => n.includes('supabase') || n.includes('sb-'));
  console.log('[AUTH:MW] pathname:', pathname, '| all cookies:', cookieNames, '| supabase cookies:', sbCookies);
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
