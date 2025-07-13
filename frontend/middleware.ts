import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Список публичных маршрутов, которые доступны без авторизации
const publicRoutes = ['/', '/register', '/admin/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Если маршрут публичный, пропускаем
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Для админ-маршрутов проверяем токен в cookies
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('access_token')
    
    if (!token) {
      const url = new URL('/admin/login', request.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

// Указываем, для каких маршрутов применять middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 