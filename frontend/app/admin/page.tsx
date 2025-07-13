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
  const [isParsing, setIsParsing] = useState(false)
  const [parsingStatus, setParsingStatus] = useState<string | null>(null)
  const [parsingBookId, setParsingBookId] = useState<number | null>(null)
  const [parsingAllPrices, setParsingAllPrices] = useState(false)
  const [isRetraining, setIsRetraining] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false)

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
      // Обновляем статистику
      setStats([
        {
          title: "Книги в каталоге",
          value: books.length.toString(),
          icon: <BookOpen className="h-6 w-6" />,
        },
        {
          title: "Отзывы",
          value: reviews.length.toString(),
          icon: <MessageSquare className="h-6 w-6" />,
        },
      ])
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
  const filteredBooks = books.filter((book: Book) => {
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
      setBooks(books.filter((book: Book) => book.id !== bookToDelete.id))
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

  const handleParsePricesClick = async (book: Book) => {
    setParsingBookId(book.id)
    try {
      const result = await api.adminParseBookPrices(book.id)
      toast({
        title: 'Парсинг цен завершён',
        description: `Добавлено цен: ${result.added}`,
      })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось спарсить цены для книги',
        variant: 'destructive',
      })
    } finally {
      setParsingBookId(null)
    }
  }

  const handleParseAllPricesClick = async () => {
    setParsingAllPrices(true)
    setParsingStatus('Парсинг цен всех книг...')
    console.log('[Парсер] Запуск парсинга цен всех книг...')
    try {
      const result = await api.adminParseAllBookPrices()
      setParsingStatus(`Парсинг завершён. Обработано: ${result.processed}, добавлено: ${result.added}, ошибок: ${result.errors}`)
      console.log(`[Парсер] Парсинг завершён. Обработано: ${result.processed}, добавлено: ${result.added}, ошибок: ${result.errors}`)
      toast({
        title: 'Парсинг завершён',
        description: `Обработано: ${result.processed}, добавлено: ${result.added}, ошибок: ${result.errors}`,
      })
      fetchData()
    } catch (error: any) {
      setParsingStatus('Ошибка при парсинге цен всех книг')
      console.error('[Парсер] Ошибка:', error)
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось выполнить парсинг',
        variant: 'destructive',
      })
    } finally {
      setParsingAllPrices(false)
      setTimeout(() => setParsingStatus(null), 5000)
    }
  }

  const handleParseBooks = async () => {
    setIsParsing(true)
    setParsingStatus('Парсинг запущен...')
    console.log('[Парсер] Запуск парсинга книг...')
    try {
      const result = await api.adminParseBooks()
      setParsingStatus(`Парсинг завершён. Добавлено: ${result.added}, пропущено: ${result.skipped}`)
      console.log(`[Парсер] Парсинг завершён. Добавлено: ${result.added}, пропущено: ${result.skipped}`)
      toast({
        title: 'Парсинг завершён',
        description: `Добавлено: ${result.added}, пропущено: ${result.skipped}`,
      })
      fetchData()
    } catch (error: any) {
      setParsingStatus('Ошибка при парсинге книг')
      console.error('[Парсер] Ошибка:', error)
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось выполнить парсинг',
        variant: 'destructive',
      })
    } finally {
      setIsParsing(false)
      setTimeout(() => setParsingStatus(null), 5000)
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
            <Link href="/admin/parsers">
              <Button variant="secondary">
                <BookOpen className="mr-2 h-4 w-4" />
                Парсинг книг
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-gray-600">Обзор системы и последние активности</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat: StatCard, index: number) => (
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
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleParseAllPricesClick}
                disabled={parsingAllPrices}
              >
                {parsingAllPrices ? 'Парсинг...' : 'Парсинг всех цен'}
              </Button>
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
          </div>
          <ul className="divide-y border rounded bg-white">
            {filteredBooks.map((book) => (
              <li
                key={book.id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50"
              >
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => router.push(`/admin/books/${book.id}`)}
                >
                  <span className="font-medium">{book.title}</span>
                  <span className="text-gray-500 text-sm ml-2">{book.author}</span>
                  <span className="text-gray-400 text-xs ml-auto">ISBN: {book.isbn}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleParsePricesClick(book)
                  }}
                  disabled={parsingBookId === book.id}
                  className="ml-2"
                >
                  {parsingBookId === book.id ? 'Парсинг...' : 'Парсинг цен'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteClick(book)
                  }}
                  className="ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
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
      {parsingStatus && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded shadow-lg px-4 py-2 z-50">
          {parsingStatus}
        </div>
      )}
    </div>
  )
}

