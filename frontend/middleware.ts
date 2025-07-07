import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Список публичных маршрутов, которые доступны без авторизации
const publicRoutes = ['/', '/register', '/admin/login']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')
  const { pathname } = request.nextUrl

  // Если маршрут публичный, пропускаем
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Если нет токена и маршрут не публичный, перенаправляем на страницу входа
  if (!token && !publicRoutes.includes(pathname)) {
    const url = new URL('/', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Если есть токен, добавляем его в заголовки для API запросов
  const requestHeaders = new Headers(request.headers)
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token.value}`)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
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