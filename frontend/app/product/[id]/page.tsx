"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star, ChevronDown, ChevronUp, Heart } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import BackButton from "@/components/back-button"
import { api, Book, Review, UserInfo, BookPrice } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function ProductPage({ params }: { params: { id: string } }) {
  const [book, setBook] = useState<Book | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)
  const [showReviews, setShowReviews] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [users, setUsers] = useState<{ [key: number]: UserInfo }>({})
  const [prices, setPrices] = useState<BookPrice[]>([])
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBook = async () => {
      try {
        console.log('Fetching book with ID:', params.id)
        const [bookData, reviewsData] = await Promise.all([
          api.getBookById(params.id),
          api.getBookReviews(params.id)
        ])
        console.log('Book data received:', bookData)
        setBook(bookData)
        setReviews(reviewsData)

        // Fetch user information for each review
        const userIds = [...new Set(reviewsData.map(review => review.user_id))]
        const userPromises = userIds.map(userId => api.getUserById(userId))
        const userData = await Promise.all(userPromises)
        const userMap = userData.reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {} as { [key: number]: UserInfo })
        setUsers(userMap)
      } catch (err) {
        console.error('Error fetching book:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch book')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBook()
  }, [params.id])

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoadingPrices(true)
      try {
        const data = await api.getBookPrices(params.id)
        setPrices(data)
      } catch (e) {
        setPrices([])
      } finally {
        setIsLoadingPrices(false)
      }
    }
    fetchPrices()
  }, [params.id])

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!book) return

      try {
        const status = await api.checkFavoriteStatus(book.id)
        setIsFavorite(status)
      } catch (err) {
        console.error('Error checking favorite status:', err)
      }
    }

    checkFavoriteStatus()
  }, [book])

  const handleFavoriteToggle = async () => {
    if (!book) return

    setIsLoadingFavorite(true)
    try {
      if (isFavorite) {
        await api.removeFromFavorites(book.id)
        toast({
          title: "Успешно",
          description: "Книга удалена из избранного",
        })
      } else {
        await api.addToFavorites(book.id)
        toast({
          title: "Успешно",
          description: "Книга добавлена в избранное",
        })
      }
      setIsFavorite(!isFavorite)
    } catch (err) {
      console.error('Error toggling favorite:', err)
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось обновить избранное",
        variant: "destructive",
      })
    } finally {
      setIsLoadingFavorite(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">Loading...</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500 py-8">{error || 'Book not found'}</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BackButton className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-900">Книга</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant={isFavorite ? "default" : "outline"}
              onClick={handleFavoriteToggle}
              disabled={isLoadingFavorite}
              className="flex items-center"
            >
              <Heart className={`h-5 w-5 mr-2 ${isFavorite ? "fill-current" : ""}`} />
              {isLoadingFavorite
                ? "Загрузка..."
                : isFavorite
                ? "В избранном"
                : "В избранное"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Image */}
          <div className="lg:col-span-1">
            <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
              {book?.image_url ? (
                <img 
                  src={book.image_url.startsWith('http') ? book.image_url : `/books/${book.image_url}`}
                  alt={`Обложка книги ${book.title}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-500">Обложка книги</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold mb-2">{book?.title}</h1>
            <p className="text-gray-600 mb-4">Автор {book?.author}</p>
            {book?.category && (
              <p className="text-gray-600 mb-4">Категория: {book.category.name}</p>
            )}

            <div className="flex items-center space-x-2 mb-6">
              <div className="flex items-center">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(book?.average_rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">{book?.average_rating.toFixed(1)}</span>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">О книге</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{book?.description}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Дополнительная информация</h3>
              <p className="text-gray-700 text-sm">ISBN: {book?.isbn}</p>
              {book?.publication_year && (
                <p className="text-gray-700 text-sm">Год публикации: {book.publication_year}</p>
              )}
            </div>

            {/* Book Prices Section */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Цены в магазинах</h3>
              {isLoadingPrices ? (
                <div className="text-gray-500">Загрузка цен...</div>
              ) : prices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {prices.map((price) => (
                    <div key={price.id} className="border rounded-lg p-4 flex flex-col items-start bg-white shadow">
                      <span className="font-bold mb-2">{price.platform}</span>
                      <span className="text-lg font-semibold mb-2">{price.price} ₽</span>
                      <a href={price.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Перейти в магазин</a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">Информация о ценах отсутствует</div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold">Отзывы</h2>
              <span className="text-gray-500">({reviews.length})</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = `/review/create?bookId=${book.id}`}
                className="flex items-center"
              >
                Написать отзыв
              </Button>
              <button
                onClick={() => setShowReviews(!showReviews)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <span>{showReviews ? "Скрыть" : "Показать"} отзывы</span>
                {showReviews ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {showReviews && (
            <div className="space-y-4">
              {isLoadingReviews ? (
                <div className="text-center py-4">Загрузка отзывов...</div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Отзывов пока нет</div>
              ) : (
                reviews.map((review) => (
                  <Link href={`/review/${review.id}`} key={review.id} className="block hover:opacity-90 transition-opacity">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs">👤</span>
                          </div>
                          <span className="font-medium text-sm">{users[review.user_id]?.username || 'Загрузка...'}</span>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{review.title}</h4>
                        <p className="text-sm text-gray-700">{review.content}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
