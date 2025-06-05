"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import BackButton from "@/components/back-button"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function CreateReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookId = searchParams.get('bookId')
  const { toast } = useToast()

  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [book, setBook] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId) return
      try {
        const bookData = await api.getBookById(bookId)
        setBook(bookData)
      } catch (err) {
        console.error('Error fetching book:', err)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить информацию о книге",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBook()
  }, [bookId, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookId) return

    setIsSubmitting(true)
    try {
      await api.createReview({
        book_id: parseInt(bookId),
        rating,
        title,
        content
      })

      toast({
        title: "Успешно",
        description: "Отзыв успешно создан",
      })

      router.push(`/product/${bookId}`)
    } catch (err) {
      console.error('Error creating review:', err)
      
      // Показываем сообщение об ошибке в браузере
      if (err instanceof Error && err.message.includes("already exists")) {
        alert("Вы уже написали отзыв на эту книгу")
      } else {
        alert(err instanceof Error ? err.message : "Не удалось создать отзыв")
      }

      // Показываем toast сообщение
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось создать отзыв",
        variant: "destructive",
      })

      // Перенаправляем на страницу книги
      router.push(`/product/${bookId}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">Loading...</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500 py-8">Книга не найдена</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <BackButton className="mr-4" />
          <h1 className="text-2xl font-bold text-gray-900">Написать отзыв</h1>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{book.title}</h2>
          <p className="text-gray-600">Автор: {book.author}</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Оценка
                </label>
                <div className="flex items-center space-x-1">
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

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Заголовок
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={1}
                  maxLength={200}
                />
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Отзыв
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={1}
                  maxLength={5000}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? "Отправка..." : "Опубликовать отзыв"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
} 