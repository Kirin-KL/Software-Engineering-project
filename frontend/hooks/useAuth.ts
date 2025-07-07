 import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      try {
        // Проверяем валидность токена
        await api.getUserData()
        setIsAuthenticated(true)
      } catch (error) {
        // Если токен невалиден или истек, очищаем данные и перенаправляем на страницу входа
        localStorage.removeItem('access_token')
        localStorage.removeItem('token_type')
        localStorage.removeItem('user')
        setIsAuthenticated(false)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('token_type')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    router.push('/')
  }

  return {
    isAuthenticated,
    isLoading,
    logout
  }
} 