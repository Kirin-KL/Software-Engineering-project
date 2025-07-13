"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, MessageSquare, Search, Plus, Trash2, RefreshCw, BarChart3, TrendingUp, Target } from "lucide-react"
import { api, Book } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"

interface StatCard {
  title: string
  value: string
  icon: React.ReactNode
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const router = useRouter()
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
  const [books, setBooks] = useState<Book[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRetraining, setIsRetraining] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false)

  useEffect(() => {
    fetchData()
    loadMetrics()
  }, [])

  const fetchData = async () => {
    try {
      // Получаем все книги
      const books = await api.getLatestBooks(1000)
      setBooks(books)
      
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
    } finally {
      setIsLoading(false)
    }
  }

  // Фильтрация книг по поисковому запросу
  const filteredBooks = books.filter(book => {
    const searchLower = searchQuery.toLowerCase()
    return (
      book.title.toLowerCase().includes(searchLower) ||
      book.author.toLowerCase().includes(searchLower)
    )
  })

  const handleDeleteClick = (book: Book) => {
    setBookToDelete(book)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return

    try {
      await api.deleteBook(bookToDelete.id)
      setBooks(books.filter(book => book.id !== bookToDelete.id))
      toast({
        title: "Успех",
        description: "Книга успешно удалена",
      })
    } catch (error) {
      console.error("Ошибка при удалении книги:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить книгу",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setBookToDelete(null)
    }
  }

  const handleRetrainRecommendations = async () => {
    setIsRetraining(true)
    try {
      await api.retrainRecommendations()
      toast({
        title: "Успех",
        description: "Модель рекомендаций успешно обновлена",
      })
      // Обновляем метрики после переобучения
      loadMetrics()
    } catch (error) {
      console.error("Ошибка при обновлении рекомендаций:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить модель рекомендаций",
        variant: "destructive",
      })
    } finally {
      setIsRetraining(false)
    }
  }

  const loadMetrics = async () => {
    setIsLoadingMetrics(true)
    try {
      const metricsData = await api.getRecommendationMetrics()
      setMetrics(metricsData)
    } catch (error) {
      console.error("Ошибка при загрузке метрик:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить метрики рекомендаций",
        variant: "destructive",
      })
    } finally {
      setIsLoadingMetrics(false)
    }
  }

  if (isLoading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Панель администратора</h1>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={handleRetrainRecommendations}
              disabled={isRetraining}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRetraining ? 'animate-spin' : ''}`} />
              {isRetraining ? 'Обновление...' : 'Обновить рекомендации'}
            </Button>
            <Link href="/admin/categories/new">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Добавить категорию
              </Button>
            </Link>
            <Link href="/admin/books/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Добавить книгу
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-gray-600">Обзор системы и последние активности</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

        {/* Recommendation Metrics */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Метрики рекомендательной системы</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadMetrics}
              disabled={isLoadingMetrics}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>
          
          {isLoadingMetrics ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Загрузка метрик...</p>
            </div>
          ) : metrics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Статус модели</p>
                        <p className="text-lg font-semibold">{metrics.model_status}</p>
                      </div>
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Пользователей в модели</p>
                        <p className="text-lg font-semibold">{metrics.users_in_model}</p>
                        <p className="text-xs text-gray-500">Покрытие: {metrics.coverage}%</p>
                      </div>
                      <Users className="h-5 w-5 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Книг в модели</p>
                        <p className="text-lg font-semibold">{metrics.books_in_model}</p>
                        <p className="text-xs text-gray-500">Разнообразие: {metrics.diversity}</p>
                      </div>
                      <BookOpen className="h-5 w-5 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Средний рейтинг</p>
                        <p className="text-lg font-semibold">{metrics.avg_recommended_rating}/5</p>
                        <p className="text-xs text-gray-500">рекомендуемых книг</p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Взаимодействия</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Всего взаимодействий:</span>
                        <span className="font-semibold">{metrics.total_interactions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Среднее на пользователя:</span>
                        <span className="font-semibold">{metrics.avg_interactions_per_user}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Размер модели:</span>
                        <span className="font-semibold">{metrics.model_file_size_mb} МБ</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Типы взаимодействий</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Отзывы:</span>
                        <span className="font-semibold">{metrics.interactions_breakdown?.reviews || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Заимствования:</span>
                        <span className="font-semibold">{metrics.interactions_breakdown?.borrowings || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Избранное:</span>
                        <span className="font-semibold">{metrics.interactions_breakdown?.favorites || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Метрики недоступны</p>
            </div>
          )}
        </div>

        {/* Books List */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Список книг</h2>
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск по названию или автору..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredBooks.map((book) => (
              <Card 
                key={book.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/admin/books/${book.id}`)}
              >
                <CardHeader className="flex flex-row items-center justify-between p-4">
                  <CardTitle className="text-lg line-clamp-1">{book.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-16 h-24 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                      {book.image_url ? (
                        <img
                          src={`/books/${book.image_url}`}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <BookOpen className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{book.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1">{book.author}</p>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 line-clamp-1">
                          ISBN: {book.isbn}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить книгу "{bookToDelete?.title}"? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
