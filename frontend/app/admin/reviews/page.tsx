"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Search, Star, Edit, Trash2, Save, X } from "lucide-react"
import AdminHeader from "@/components/admin-header"

interface Review {
  id: number
  user: string
  userEmail: string
  bookTitle: string
  bookAuthor: string
  rating: number
  title: string
  content: string
  date: string
  status: "published" | "pending" | "hidden"
}

export default function AdminReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [editingReview, setEditingReview] = useState<number | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editTitle, setEditTitle] = useState("")

  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 1,
      user: "Наталья",
      userEmail: "natasha@example.com",
      bookTitle: "Бойцовский клуб",
      bookAuthor: "Чак Паланик",
      rating: 5,
      title: "Культовая книга",
      content:
        "Высокие рейтинги, восторженные отзывы, но что же можем понять мы так? А в Вам рассказу. Это было второе мое знакомство с автором, думаю, что он стал одним из любимых. Не понимаю, как произведение может просто так зацепить, а не оставить равнодушным.",
      date: "2024-01-22",
      status: "published",
    },
    {
      id: 2,
      user: "Книжный червь",
      userEmail: "user1@example.com",
      bookTitle: "Поющие в терновнике",
      bookAuthor: "Колин Маккалоу",
      rating: 4,
      title: "Отличная книга!",
      content:
        "В последнее время я увлекаюсь магической литературой, поэтому эта книга пришлась мне по душе. Написана потрясающе, рекомендую всем любителям качественной прозы.",
      date: "2024-01-21",
      status: "published",
    },
    {
      id: 3,
      user: "Александр",
      userEmail: "alex@example.com",
      bookTitle: "Стена",
      bookAuthor: "Жан-Поль Сартр",
      rating: 5,
      title: "Философская глубина",
      content:
        "Каждые полгода перечитываю. Сегодня это произошло снова! Жан Поль Сартр из сборника 'Стена' - это нечто особенное. Философская глубина поражает.",
      date: "2024-01-20",
      status: "pending",
    },
    {
      id: 4,
      user: "Мария",
      userEmail: "maria@example.com",
      bookTitle: "Театр",
      bookAuthor: "Уильям Сомерсет Моэм",
      rating: 3,
      title: "Неплохо, но не впечатлило",
      content: "Книга написана хорошо, но сюжет показался мне предсказуемым. Возможно, просто не мой жанр.",
      date: "2024-01-19",
      status: "hidden",
    },
  ])

  const getFilteredReviews = () => {
    if (!searchQuery.trim()) return reviews

    return reviews.filter(
      (review) =>
        review.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.bookAuthor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }

  const handleDeleteReview = (id: number) => {
    if (confirm("Вы уверены, что хотите удалить этот отзыв?")) {
      setReviews(reviews.filter((review) => review.id !== id))
    }
  }

  const handleEditReview = (review: Review) => {
    setEditingReview(review.id)
    setEditTitle(review.title)
    setEditContent(review.content)
  }

  const handleSaveEdit = (id: number) => {
    setReviews(
      reviews.map((review) => (review.id === id ? { ...review, title: editTitle, content: editContent } : review)),
    )
    setEditingReview(null)
    setEditTitle("")
    setEditContent("")
  }

  const handleCancelEdit = () => {
    setEditingReview(null)
    setEditTitle("")
    setEditContent("")
  }

  const handleChangeStatus = (id: number, newStatus: "published" | "pending" | "hidden") => {
    setReviews(reviews.map((review) => (review.id === id ? { ...review, status: newStatus } : review)))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "hidden":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "published":
        return "Опубликован"
      case "pending":
        return "На модерации"
      case "hidden":
        return "Скрыт"
      default:
        return "Неизвестно"
    }
  }

  const totalReviews = reviews.length
  const publishedReviews = reviews.filter((r) => r.status === "published").length
  const pendingReviews = reviews.filter((r) => r.status === "pending").length
  const hiddenReviews = reviews.filter((r) => r.status === "hidden").length

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Управление отзывами</h1>
          <p className="text-gray-600">Модерация и редактирование отзывов пользователей</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{totalReviews}</p>
                <p className="text-sm text-gray-600">Всего отзывов</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{publishedReviews}</p>
                <p className="text-sm text-gray-600">Опубликованных</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{pendingReviews}</p>
                <p className="text-sm text-gray-600">На модерации</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{hiddenReviews}</p>
                <p className="text-sm text-gray-600">Скрытых</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Input
              type="text"
              placeholder="Поиск отзывов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {getFilteredReviews().map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">{review.user.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{review.user}</h3>
                      <p className="text-sm text-gray-600">{review.userEmail}</p>
                      <p className="text-xs text-gray-500">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={getStatusColor(review.status)}>{getStatusText(review.status)}</Badge>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleEditReview(review)} size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteReview(review.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900">{review.bookTitle}</h4>
                  <p className="text-sm text-gray-600">Автор: {review.bookAuthor}</p>
                  <div className="flex items-center mt-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>

                {editingReview === review.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок отзыва</label>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Заголовок отзыва"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Содержание отзыва</label>
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                        placeholder="Содержание отзыва"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleSaveEdit(review.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Сохранить
                      </Button>
                      <Button onClick={handleCancelEdit} size="sm" variant="outline">
                        <X className="h-4 w-4 mr-1" />
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-semibold mb-2">{review.title}</h4>
                    <p className="text-gray-700 leading-relaxed">{review.content}</p>
                  </div>
                )}

                <div className="flex space-x-2 mt-4 pt-4 border-t">
                  {review.status !== "published" && (
                    <Button
                      onClick={() => handleChangeStatus(review.id, "published")}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Опубликовать
                    </Button>
                  )}
                  {review.status !== "pending" && (
                    <Button
                      onClick={() => handleChangeStatus(review.id, "pending")}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      На модерацию
                    </Button>
                  )}
                  {review.status !== "hidden" && (
                    <Button
                      onClick={() => handleChangeStatus(review.id, "hidden")}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Скрыть
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
