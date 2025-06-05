"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Star } from "lucide-react"
import AdminHeader from "@/components/admin-header"

interface Book {
  id: number
  title: string
  author: string
  genre: string
  publisher: string
  price: number
  rating: number
  status: "published" | "draft" | "pending"
  dateAdded: string
}

export default function AdminBooksPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [books, setBooks] = useState<Book[]>([
    {
      id: 1,
      title: "Поющие в терновнике",
      author: "Колин Маккалоу",
      genre: "Роман",
      publisher: "АСТ",
      price: 358,
      rating: 4.8,
      status: "published",
      dateAdded: "2024-01-15",
    },
    {
      id: 2,
      title: "Бойцовский клуб",
      author: "Чак Паланик",
      genre: "Современная проза",
      publisher: "РИПОЛ",
      price: 420,
      rating: 4.6,
      status: "published",
      dateAdded: "2024-01-20",
    },
    {
      id: 3,
      title: "Новая книга",
      author: "Новый автор",
      genre: "Фантастика",
      publisher: "Росмэн",
      price: 500,
      rating: 0,
      status: "draft",
      dateAdded: "2024-01-22",
    },
  ])

  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    genre: "",
    publisher: "",
    price: "",
    description: "",
    pages: "",
  })

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newBook.title || !newBook.author || !newBook.genre || !newBook.price) {
      alert("Пожалуйста, заполните все обязательные поля")
      return
    }

    const book: Book = {
      id: books.length + 1,
      title: newBook.title,
      author: newBook.author,
      genre: newBook.genre,
      publisher: newBook.publisher || "Не указано",
      price: Number(newBook.price),
      rating: 0,
      status: "draft",
      dateAdded: new Date().toISOString().split("T")[0],
    }

    setBooks([...books, book])
    setNewBook({
      title: "",
      author: "",
      genre: "",
      publisher: "",
      price: "",
      description: "",
      pages: "",
    })
    setShowCreateForm(false)
    alert("Книга успешно создана!")
  }

  const handleDeleteBook = (id: number) => {
    if (confirm("Вы уверены, что хотите удалить эту книгу?")) {
      setBooks(books.filter((book) => book.id !== id))
    }
  }

  const handlePublishBook = (id: number) => {
    setBooks(books.map((book) => (book.id === id ? { ...book, status: "published" as const } : book)))
  }

  const getFilteredBooks = () => {
    if (!searchQuery.trim()) return books

    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.genre.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "published":
        return "Опубликована"
      case "draft":
        return "Черновик"
      case "pending":
        return "На модерации"
      default:
        return "Неизвестно"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Управление книгами</h1>
            <p className="text-gray-600">Создание и редактирование книг в каталоге</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-black hover:bg-gray-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Добавить книгу
          </Button>
        </div>

        {/* Create Book Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Создать новую книгу</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBook} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название книги *</Label>
                    <Input
                      id="title"
                      value={newBook.title}
                      onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                      placeholder="Введите название книги"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author">Автор *</Label>
                    <Input
                      id="author"
                      value={newBook.author}
                      onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                      placeholder="Введите имя автора"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genre">Жанр *</Label>
                    <Select value={newBook.genre} onValueChange={(value) => setNewBook({ ...newBook, genre: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите жанр" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Роман">Роман</SelectItem>
                        <SelectItem value="Детектив">Детектив</SelectItem>
                        <SelectItem value="Фантастика">Фантастика</SelectItem>
                        <SelectItem value="Фэнтези">Фэнтези</SelectItem>
                        <SelectItem value="Классика">Классика</SelectItem>
                        <SelectItem value="Современная проза">Современная проза</SelectItem>
                        <SelectItem value="Философия">Философия</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="publisher">Издательство</Label>
                    <Select
                      value={newBook.publisher}
                      onValueChange={(value) => setNewBook({ ...newBook, publisher: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите издательство" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="АСТ">АСТ</SelectItem>
                        <SelectItem value="РИПОЛ">РИПОЛ</SelectItem>
                        <SelectItem value="Росмэн">Росмэн</SelectItem>
                        <SelectItem value="Триумф">Триумф</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Цена (₽) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newBook.price}
                      onChange={(e) => setNewBook({ ...newBook, price: e.target.value })}
                      placeholder="Введите цену"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pages">Количество страниц</Label>
                    <Input
                      id="pages"
                      type="number"
                      value={newBook.pages}
                      onChange={(e) => setNewBook({ ...newBook, pages: e.target.value })}
                      placeholder="Введите количество страниц"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={newBook.description}
                    onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                    placeholder="Введите описание книги"
                    rows={4}
                  />
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" className="bg-black hover:bg-gray-800 text-white">
                    Создать книгу
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Input
              type="text"
              placeholder="Поиск книг..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Books List */}
        <Card>
          <CardHeader>
            <CardTitle>Все книги ({getFilteredBooks().length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getFilteredBooks().map((book) => (
                <div key={book.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex space-x-4">
                    <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-500 text-xs">Обложка</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{book.title}</h3>
                      <p className="text-gray-600">{book.author}</p>
                      <p className="text-sm text-gray-500">
                        {book.genre} • {book.publisher}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-bold">{book.price} ₽</span>
                        {book.rating > 0 && (
                          <div className="flex items-center">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-gray-600 ml-1">{book.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(book.status)}`}>
                      {getStatusText(book.status)}
                    </span>
                    <div className="flex space-x-2">
                      {book.status === "draft" && (
                        <Button
                          onClick={() => handlePublishBook(book.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Опубликовать
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteBook(book.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
