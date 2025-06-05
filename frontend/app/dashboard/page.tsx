"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, MessageSquare } from "lucide-react"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import HeroSlider from "@/components/hero-slider"
import { api } from "@/lib/api"

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

interface Book {
  id: number
  title: string
  author: string
  description: string
  isbn: string
  publication_year: number
  category_id: number
  total_copies: number
  available_copies: number
  is_available: boolean
  owner_id: number
  created_at: string
  updated_at: string
  average_rating: number
  category: {
    id: number
    name: string
    description: string
  }
}

interface Review {
  id: number
  book_id: number
  user_id: number
  rating: number
  title: string
  content: string
  created_at: string
  updated_at: string
  book?: Book
  user: {
    id: number
    username: string
  }
  comments: Array<{
    id: number
    content: string
    created_at: string
    user_id: number
  }>
}

export default function DashboardPage() {
  const [latestBooks, setLatestBooks] = useState<Book[]>([])
  const [latestReviews, setLatestReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [booksData, reviewsData] = await Promise.all([
          api.getLatestBooks(3),
          api.getReviews(0, 3)
        ])
        setLatestBooks(booksData)
        setLatestReviews(reviewsData)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Не удалось загрузить данные')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Slider */}
        <HeroSlider />

        {/* Latest Reviews and Books Section */}
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Reviews (Left side) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Последние отзывы</h2>
                <Link href="/forum">
                  <Button variant="outline">Все отзывы</Button>
                </Link>
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Загрузка отзывов...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Попробовать снова
                  </Button>
                </div>
              ) : latestReviews.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Отзывов пока нет</p>
                </div>
              ) : (
                latestReviews.map((review) => (
                  <Link key={review.id} href={`/review/${review.id}`} className="block hover:opacity-90 transition-opacity">
                    <Card className="p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{review.rating.toFixed(1)}</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{review.title}</h3>
                      <p className="text-gray-600 mb-2 line-clamp-3">{review.content}</p>
                      {review.book && review.book.id && review.book.title && (
                        <p className="text-sm text-gray-500 mb-4">
                          Книга: <Link href={`/product/${review.book.id}`} className="text-blue-600 hover:underline">{review.book.title}</Link>
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span suppressHydrationWarning>{formatDate(review.created_at)}</span>
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>{review.comments.length}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))
              )}
            </div>

            {/* Latest Books (Right side) */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Новые книги</h2>
                <Link href="/catalog">
                  <Button variant="outline">Все книги</Button>
                </Link>
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Загрузка книг...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Попробовать снова
                  </Button>
                </div>
              ) : latestBooks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Книг пока нет</p>
                </div>
              ) : (
                latestBooks.map((book) => (
                  <Card key={book.id} className="p-4">
                    <div className="flex space-x-3">
                      <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-500 text-xs text-center">Обложка</span>
                      </div>
                      <div className="flex-1">
                        <Link href={`/product/${book.id}`} className="hover:text-blue-600">
                          <h4 className="font-semibold text-sm mb-1">{book.title}</h4>
                        </Link>
                        <p className="text-gray-600 text-xs mb-2">{book.author}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-600">{book.average_rating.toFixed(1)}</span>
                          </div>
                          <Link href={`/product/${book.id}`}>
                            <Button size="sm" className="bg-black hover:bg-gray-800 text-white text-xs">
                              Подробнее
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Additional Content for Scrolling */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Лучшее</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {latestBooks
              .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
              .slice(0, 12)
              .map((book) => (
                <Card key={book.id} className="p-3 relative">
                  <Link href={`/product/${book.id}`}>
                    <div className="w-full h-32 bg-gray-200 rounded mb-3 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">Обложка</span>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{book.title}</h4>
                    <p className="text-gray-600 text-xs mb-2">{book.author}</p>
                    {/* Rating in corner */}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded-full flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{book.average_rating.toFixed(1)}</span>
                    </div>
                  </Link>
                </Card>
              ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
