"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, MessageSquare } from "lucide-react"
import AdminHeader from "@/components/admin-header"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface StatCard {
  title: string
  value: string
  icon: React.ReactNode
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessKey, setAccessKey] = useState("")
  const [stats, setStats] = useState<StatCard[]>([
    {
      title: "Всего пользователей",
      value: "0",
      icon: <Users className="h-6 w-6" />,
    },
    {
      title: "Книги в каталоге",
      value: "0",
      icon: <BookOpen className="h-6 w-6" />,
    },
    {
      title: "Отзывы",
      value: "0",
      icon: <MessageSquare className="h-6 w-6" />,
    },
  ])

  useEffect(() => {
    // Проверяем наличие токена при загрузке
    const token = localStorage.getItem('access_token')
    if (token === 'admin-token') {
      setIsAuthenticated(true)
      fetchData()
    }
  }, [])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.adminLogin(accessKey)
      setIsAuthenticated(true)
      fetchData()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Неверный ключ доступа",
        variant: "destructive",
      })
    }
  }

  const fetchData = async () => {
    try {
      // Получаем все книги
      const books = await api.getLatestBooks(1000)
      
      // Получаем все отзывы
      const reviews = await api.getReviews(0, 1000)
      
      // Получаем всех пользователей
      const users = await api.getAllUsers()

      // Обновляем статистику
      setStats(prev => prev.map(stat => {
        if (stat.title === "Всего пользователей") {
          return { ...stat, value: users.length.toString() }
        }
        if (stat.title === "Книги в каталоге") {
          return { ...stat, value: books.length.toString() }
        }
        if (stat.title === "Отзывы") {
          return { ...stat, value: reviews.length.toString() }
        }
        return stat
      }))
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные статистики",
        variant: "destructive",
      })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Вход в панель администратора</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Введите ключ доступа"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Панель администратора</h1>
          <p className="text-gray-600">Обзор системы и последние активности</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className="text-gray-400">{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
