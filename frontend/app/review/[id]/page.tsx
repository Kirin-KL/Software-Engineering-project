"use client"

import { useEffect, useState, use } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Plus, MessageSquare, Edit, Trash2 } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import BackButton from "@/components/back-button"
import { api, Review, UserInfo } from "@/lib/api"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
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

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ReviewPage({ params }: PageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const unwrappedParams = use(params)
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [userCache, setUserCache] = useState<Record<number, UserInfo>>({})
  const [submittingComment, setSubmittingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState("")
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editRating, setEditRating] = useState(0)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [toxicModalOpen, setToxicModalOpen] = useState(false)
  const [toxicModalMessage, setToxicModalMessage] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Получаем данные текущего пользователя
        const userData = await api.getUserData()
        setCurrentUser(userData)

        // Получаем данные отзыва
        const data = await api.getReviewById(Number(unwrappedParams.id))
        setReview(data)
        setEditRating(data.rating)
        setEditTitle(data.title)
        setEditContent(data.content)
        
        // Загружаем информацию о пользователях
        const userIds = new Set([
          data.user_id,
          ...data.comments.map(comment => comment.user_id)
        ])
        
        for (const userId of userIds) {
          if (!userCache[userId]) {
            const userInfo = await api.getUserById(userId)
            setUserCache(prev => ({ ...prev, [userId]: userInfo }))
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Не удалось загрузить данные")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [unwrappedParams.id])

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!review) return

    try {
      setIsSubmitting(true)
      const updatedReview = await api.updateReview(review.id, {
        rating: editRating,
        title: editTitle,
        content: editContent
      })
      setReview(updatedReview)
      setIsEditing(false)
      toast({
        title: "Успешно",
        description: "Отзыв обновлен",
      })
    } catch (err) {
      console.error("Error updating review:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить отзыв",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteReview = async () => {
    if (!review) return

    try {
      await api.deleteReview(review.id)
      toast({
        title: "Успешно",
        description: "Отзыв удален",
      })
      router.push('/profile/reviews')
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить отзыв",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submittingComment || !review) return

    try {
      setSubmittingComment(true)
      const newCommentData = await api.addComment(review.id, newComment, isAnonymous)
      setNewComment("")
      
      // Refresh review to get updated comments
      const data = await api.getReviewById(review.id)
      setReview(data)
      
      // Load user info only for the new comment
      if (!userCache[newCommentData.user_id]) {
        const userInfo = await api.getUserById(newCommentData.user_id)
        setUserCache(prev => ({ ...prev, [newCommentData.user_id]: userInfo }))
      }
    } catch (err) {
      console.error("Error adding comment:", err)
      if (err instanceof Error && (err.message.includes("токсичность") || err.message.includes("не относится к теме книги"))) {
        let msg = err.message
        if (msg.startsWith('400: ')) msg = msg.slice(5)
        setToxicModalMessage(msg)
        setToxicModalOpen(true)
        return
      }
      alert("Не удалось добавить комментарий")
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleEditComment = async (commentId: number, content: string) => {
    try {
      setSubmittingComment(true)
      await api.updateComment(commentId, content)
      setEditingCommentId(null)
      setEditingCommentContent("")
      // Refresh review to get updated comments
      const data = await api.getReviewById(review!.id)
      setReview(data)
    } catch (err) {
      console.error("Error updating comment:", err)
      alert("Не удалось обновить комментарий")
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот комментарий?")) return

    try {
      setSubmittingComment(true)
      await api.deleteComment(commentId)
      // Refresh review to get updated comments
      const data = await api.getReviewById(review!.id)
      setReview(data)
    } catch (err) {
      console.error("Error deleting comment:", err)
      alert("Не удалось удалить комментарий")
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <BackButton fallbackUrl="/forum" className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-900">Загрузка отзыва...</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <BackButton fallbackUrl="/forum" className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-900">Ошибка</h1>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">{error || "Отзыв не найден"}</p>
              <Button onClick={() => window.location.reload()}>
                Попробовать снова
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BackButton fallbackUrl="/forum" className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-900">Окно рецензии</h1>
          </div>
          {currentUser && currentUser.id === review.user_id && !isEditing && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Review Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600">👤</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{userCache[review.user_id]?.username || "Загрузка..."}</h3>
                    {!isEditing && (
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <form onSubmit={handleEditSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Оценка
                      </label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                star <= editRating
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
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
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
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        required
                        className="w-full min-h-[200px]"
                      />
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setEditRating(review.rating)
                          setEditTitle(review.title)
                          setEditContent(review.content)
                        }}
                      >
                        Отмена
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || editRating === 0}
                      >
                        {isSubmitting ? "Сохранение..." : "Сохранить"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h2 className="text-xl font-bold mb-4">{review.title}</h2>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{review.content}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Комментарии</h3>

                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <Textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Напишите комментарий..."
                    rows={3}
                    className="w-full"
                  />
                  {/* Anonymous Checkbox */}
                  <div className="flex items-center">
                    <input
                      id="isAnonymousComment"
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={e => setIsAnonymous(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="isAnonymousComment" className="text-sm text-gray-700">Опубликовать анонимно</label>
                  </div>
                  <Button type="submit" disabled={submittingComment || !newComment.trim()}>
                    {submittingComment ? "Отправка..." : "Добавить комментарий"}
                  </Button>
                </form>

                {review.comments.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>Комментариев нет</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {review.comments.map((comment) => (
                      <div key={comment.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {comment.is_anonymous ? 'Аноним' : (userCache[comment.user_id]?.username || 'Загрузка...')}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          {comment.user_id === userCache[comment.user_id]?.id && (
                            <div className="flex items-center space-x-2">
                              {editingCommentId === comment.id ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditComment(comment.id, editingCommentContent)}
                                    disabled={submittingComment}
                                  >
                                    Сохранить
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingCommentId(null)
                                      setEditingCommentContent("")
                                    }}
                                  >
                                    Отмена
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingCommentId(comment.id)
                                      setEditingCommentContent(comment.content)
                                    }}
                                  >
                                    Редактировать
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteComment(comment.id)}
                                  >
                                    Удалить
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        {editingCommentId === comment.id ? (
                          <Textarea
                            value={editingCommentContent}
                            onChange={(e) => setEditingCommentContent(e.target.value)}
                            className="w-full mb-2"
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-700">{comment.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Book Info Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="w-full h-[260px] bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                  <div className="relative aspect-[3/4] w-full h-full overflow-hidden rounded-lg">
                    {review.book.image_url ? (
                      <img
                        src={`/books/${review.book.image_url}`}
                        alt={`Обложка книги ${review.book.title}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">Обложка книги</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <Link href={`/product/${review.book.id}`} className="hover:underline">
                    <h4 className="font-semibold text-lg mb-1">{review.book.title}</h4>
                    <p className="text-sm text-gray-600">Автор: {review.is_anonymous ? 'Аноним' : (userCache[review.user_id]?.username || 'Загрузка...')}</p>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
              onClick={handleDeleteReview}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={toxicModalOpen} onOpenChange={setToxicModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toxicModalMessage.includes('не относится к теме книги')
                ? 'Текст не относится к теме книги'
                : 'Токсичный текст'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toxicModalMessage.includes('не относится к теме книги')
                ? 'Пожалуйста, напишите отзыв по теме книги.'
                : toxicModalMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setToxicModalOpen(false)}>Ок</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  )
}
