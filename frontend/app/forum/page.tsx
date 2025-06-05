"use client"

import { useEffect, useState } from "react"
import { api, UserInfo } from "@/lib/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, MessageSquare, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"

interface Review {
  id: number
  title: string
  content: string
  rating: number
  created_at: string
  updated_at: string
  user_id: number
  book_id: number
  book: {
    id: number
    title: string
    author: string
    average_rating: number
  }
  comments: Array<{
    id: number
    content: string
    created_at: string
    updated_at: string
    user_id: number
    review_id: number
  }>
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">{rating.toFixed(1)}</span>
    </div>
  )
}

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

export default function ForumPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [sortBy, setSortBy] = useState("newest")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [userCache, setUserCache] = useState<Record<number, UserInfo>>({})
  const [searchQuery, setSearchQuery] = useState("")

  const fetchUserInfo = async (userId: number) => {
    if (userCache[userId]) return userCache[userId]
    
    try {
      const userInfo = await api.getUserById(userId)
      setUserCache(prev => ({ ...prev, [userId]: userInfo }))
      return userInfo
    } catch (err) {
      console.error('Error fetching user info:', err)
      return null
    }
  }

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        const data = await api.getReviews((page - 1) * 10, 10)
        if (data.length < 10) {
          setHasMore(false)
        }
        setReviews(prev => page === 1 ? data : [...prev, ...data])

        // Fetch user info for all reviews
        const userIds = new Set(data.map(review => review.user_id))
        for (const userId of userIds) {
          await fetchUserInfo(userId)
        }
      } catch (err) {
        setError("Не удалось загрузить отзывы")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [page])

  const filteredReviews = reviews.filter(review => {
    const searchLower = searchQuery.toLowerCase()
    return (
      review.book.title.toLowerCase().includes(searchLower) ||
      review.book.author.toLowerCase().includes(searchLower) ||
      review.title.toLowerCase().includes(searchLower) ||
      review.content.toLowerCase().includes(searchLower)
    )
  })

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case "rating":
        return b.rating - a.rating
      case "comments":
        return b.comments.length - a.comments.length
      default:
        return 0
    }
  })

  const loadMore = () => {
    setPage(prev => prev + 1)
  }

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="w-full">
                  <CardHeader className="p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent className="p-4">
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-red-600">{error}</h2>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Попробовать снова
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Форум</h1>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Сначала новые</SelectItem>
                  <SelectItem value="oldest">Сначала старые</SelectItem>
                  <SelectItem value="rating">По рейтингу</SelectItem>
                  <SelectItem value="comments">По количеству комментариев</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск по названию книги, автору или содержанию отзыва..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4 min-h-[400px]">
            {sortedReviews.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'Отзывы не найдены' : 'Отзывов пока нет'}
                </p>
              </div>
            ) : (
              <>
                {sortedReviews.map((review) => (
                  <Card key={review.id} className="w-full hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg line-clamp-1">{review.title}</CardTitle>
                          <CardDescription>
                            <Link href={`/product/${review.book.id}`} className="hover:underline">
                              {review.book.title} - {review.book.author}
                            </Link>
                          </CardDescription>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="h-20">
                        <p className="text-gray-700 whitespace-pre-line line-clamp-2">{review.content}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <span>Автор: {userCache[review.user_id]?.username || 'Загрузка...'}</span>
                        <span>{formatDate(review.created_at)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 border-t">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MessageSquare className="h-4 w-4" />
                          <span>{review.comments.length} комментариев</span>
                        </div>
                        <Link href={`/review/${review.id}`}>
                          <Button variant="outline" size="sm">
                            Подробнее
                          </Button>
                        </Link>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
                {hasMore && !searchQuery && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={loadMore}
                      variant="outline"
                      disabled={loading}
                    >
                      {loading ? 'Загрузка...' : 'Загрузить еще'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
