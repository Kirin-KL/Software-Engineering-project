"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import BackButton from "@/components/back-button"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function EditReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [review, setReview] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const reviewData = await api.getReviewById(parseInt(params.id))
        setReview(reviewData)
        setRating(reviewData.rating)
        setTitle(reviewData.title)
        setContent(reviewData.content)
      } catch (err) {
        console.error('Error fetching review:', err)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить отзыв",
          variant: "destructive",
        })
        router.push('/profile/reviews')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReview()
  }, [params.id, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await api.updateReview(parseInt(params.id), {
        rating,
        title,
        content,
      })

      toast({
        title: "Успешно",
        description: "Отзыв обновлен",
      })

      router.push('/profile/reviews')
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить отзыв",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">Loading...</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <BackButton className="mr-4" />
          <h1 className="text-2xl font-bold text-gray-900">Редактировать отзыв</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">{review.book.title}</h2>
              <p className="text-gray-600">Автор: {review.book.author}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Оценка
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Заголовок
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Содержание
                </label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full min-h-[200px]"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/profile/reviews')}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                >
                  {isSubmitting ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
} 