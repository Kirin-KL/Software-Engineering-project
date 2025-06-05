"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Trash2 } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import BackButton from "@/components/back-button"
import { api, Review, UserInfo } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function UserReviewsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Получаем данные пользователя
        const userData = await api.getUserData()
        setUser(userData)

        // Получаем отзывы пользователя
        const userReviews = await api.getUserReviews(userData.id)
        setReviews(userReviews)
      } catch (err) {
        console.error('Error fetching data:', err)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await api.deleteReview(reviewId)
      setReviews(reviews.filter(review => review.id !== reviewId))
      toast({
        title: "Успешно",
        description: "Отзыв удален",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить отзыв",
        variant: "destructive",
      })
    } finally {
      setReviewToDelete(null)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>, reviewId: number) => {
    e.preventDefault()
    e.stopPropagation()
    setReviewToDelete(reviewId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 w-full px-12 sm:px-16 lg:px-24 py-8">
          <div className="text-center py-8">Loading...</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 w-full px-12 sm:px-16 lg:px-24 py-8">
        <div className="flex items-center mb-6">
          <BackButton className="mr-4" />
          <h1 className="text-2xl font-bold text-gray-900">Мои отзывы</h1>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">У вас пока нет отзывов</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Link 
                key={review.id} 
                href={`/review/${review.id}`} 
                className="block hover:opacity-95 transition-opacity"
              >
                <Card className="w-full">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold mb-2">{review.book.title}</h2>
                        <p className="text-gray-600 mb-2">Автор: {review.book.author}</p>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteClick(e, review.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="h-20">
                      <h3 className="font-medium mb-2 line-clamp-1">{review.title}</h3>
                      <p className="text-gray-600 line-clamp-2">{review.content}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={reviewToDelete !== null} onOpenChange={() => setReviewToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить отзыв?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Отзыв будет удален навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reviewToDelete && handleDeleteReview(reviewToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  )
} 