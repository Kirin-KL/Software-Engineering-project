"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Search } from "lucide-react"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import BackButton from "@/components/back-button"

interface Book {
  id: number
  title: string
  author: string
  rating: number
  price: string
  dateAdded: string
  popularity: number
  genre: string
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [sortBy, setSortBy] = useState("relevance")

  // Mock books database
  const allBooks: Book[] = [
    {
      id: 1,
      title: "Поющие в терновнике",
      author: "Колин Маккалоу",
      rating: 4.8,
      price: "358 ₽",
      dateAdded: "2024-01-15",
      popularity: 95,
      genre: "Роман",
    },
    {
      id: 2,
      title: "Бойцовский клуб",
      author: "Чак Паланик",
      rating: 4.6,
      price: "420 ₽",
      dateAdded: "2024-01-20",
      popularity: 87,
      genre: "Современная проза",
    },
    {
      id: 3,
      title: "Театр",
      author: "Уильям Сомерсет Моэм",
      rating: 4.7,
      price: "350 ₽",
      dateAdded: "2024-01-10",
      popularity: 92,
      genre: "Классика",
    },
    {
      id: 4,
      title: "О дивный новый мир",
      author: "Олдос Леонард Хаксли",
      rating: 4.5,
      price: "380 ₽",
      dateAdded: "2024-01-25",
      popularity: 78,
      genre: "Фантастика",
    },
    {
      id: 5,
      title: "Богач, бедняк",
      author: "Ирвин Шоу",
      rating: 4.8,
      price: "400 ₽",
      dateAdded: "2024-01-18",
      popularity: 89,
      genre: "Роман",
    },
    {
      id: 6,
      title: "Стена",
      author: "Жан-Поль Сартр",
      rating: 4.4,
      price: "320 ₽",
      dateAdded: "2024-01-12",
      popularity: 65,
      genre: "Философия",
    },
    {
      id: 7,
      title: "Игра в бисер",
      author: "Герман Гессе",
      rating: 4.4,
      price: "450 ₽",
      dateAdded: "2024-01-22",
      popularity: 71,
      genre: "Философия",
    },
    {
      id: 8,
      title: "1984",
      author: "Джордж Оруэлл",
      rating: 4.9,
      price: "390 ₽",
      dateAdded: "2024-01-14",
      popularity: 98,
      genre: "Антиутопия",
    },
    {
      id: 9,
      title: "Мастер и Маргарита",
      author: "Михаил Булгаков",
      rating: 4.8,
      price: "370 ₽",
      dateAdded: "2024-01-16",
      popularity: 94,
      genre: "Классика",
    },
    {
      id: 10,
      title: "Преступление и наказание",
      author: "Фёдор Достоевский",
      rating: 4.7,
      price: "340 ₽",
      dateAdded: "2024-01-11",
      popularity: 91,
      genre: "Классика",
    },
  ]

  const getSearchResults = () => {
    if (!searchQuery.trim()) {
      return []
    }

    const results = allBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.genre.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    // Apply sorting
    switch (sortBy) {
      case "new":
        results.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
        break
      case "popular":
        results.sort((a, b) => b.popularity - a.popularity)
        break
      case "rating":
        results.sort((a, b) => b.rating - a.rating)
        break
      case "relevance":
        // Sort by relevance (exact title matches first, then author matches)
        results.sort((a, b) => {
          const aTitle = a.title.toLowerCase().includes(searchQuery.toLowerCase())
          const bTitle = b.title.toLowerCase().includes(searchQuery.toLowerCase())
          if (aTitle && !bTitle) return -1
          if (!aTitle && bTitle) return 1
          return b.popularity - a.popularity
        })
        break
    }

    return results
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Update URL with new search query
    const url = new URL(window.location.href)
    url.searchParams.set("q", searchQuery)
    window.history.pushState({}, "", url.toString())
  }

  const addToCart = (bookId: number) => {
    console.log("Added to cart:", bookId)
    alert("Товар добавлен в корзину!")
  }

  const searchResults = getSearchResults()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <BackButton className="mr-4" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {searchQuery ? `Результаты поиска: "${searchQuery}"` : "Поиск"}
            </h1>
            {searchResults.length > 0 && (
              <p className="text-sm text-gray-500">Найдено {searchResults.length} результатов</p>
            )}
          </div>
        </div>

        {/* Search Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Сортировать" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">По релевантности</SelectItem>
              <SelectItem value="new">Новые</SelectItem>
              <SelectItem value="popular">Популярные</SelectItem>
              <SelectItem value="rating">Высокий рейтинг</SelectItem>
            </SelectContent>
          </Select>

          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Input
                type="text"
                placeholder="Поиск книги, автора или жанра..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-10"
              />
              <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {!searchQuery.trim() ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Введите запрос для поиска</h3>
            <p className="text-gray-500">Найдите книги по названию, автору или жанру</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ничего не найдено</h3>
            <p className="text-gray-500 mb-4">
              По запросу "{searchQuery}" ничего не найдено. Попробуйте изменить поисковый запрос.
            </p>
            <Link href="/catalog/genre/all">
              <Button className="bg-black hover:bg-gray-800 text-white">Посмотреть весь каталог</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {searchResults.map((book) => (
              <Card key={book.id} className="p-4">
                <div className="flex space-x-4">
                  <div className="w-20 h-28 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-500 text-xs text-center">Обложка</span>
                  </div>
                  <div className="flex-1">
                    <Link href={`/product/${book.id}`} className="hover:text-blue-600">
                      <h3 className="font-semibold text-lg mb-1">{book.title}</h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-1">{book.author}</p>
                    <p className="text-gray-500 text-xs mb-2">{book.genre}</p>
                    <div className="flex items-center space-x-1 mb-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">{book.rating}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Link href={`/product/${book.id}`}>
                        <Button size="sm" className="bg-black hover:bg-gray-800 text-white">
                          Подробнее
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
