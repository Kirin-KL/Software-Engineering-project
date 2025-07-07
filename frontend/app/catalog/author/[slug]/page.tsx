"use client"

import Link from "next/link"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Search } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import BackButton from "@/components/back-button"

interface Book {
  id: number
  title: string
  author: string
  rating: number
  dateAdded: string
  popularity: number
}

export default function AuthorCatalogPage({ params }: { params: { slug: string } }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("")

  // Mock books data
  const books: Book[] = [
    {
      id: 1,
      title: "Поющие в терновнике",
      author: "Колин Маккалоу",
      rating: 4.8,
      dateAdded: "2024-01-15",
      popularity: 95,
    },
    {
      id: 2,
      title: "Бойцовский клуб",
      author: "Чак Паланик",
      rating: 4.6,
      dateAdded: "2024-01-20",
      popularity: 87,
    },
    {
      id: 3,
      title: "Театр",
      author: "Уильям Сомерсет Моэм",
      rating: 4.7,
      dateAdded: "2024-01-10",
      popularity: 92,
    },
    {
      id: 4,
      title: "О дивный новый мир",
      author: "Олдос Леонард Хаксли",
      rating: 4.5,
      dateAdded: "2024-01-25",
      popularity: 78,
    },
    {
      id: 5,
      title: "Богач, бедняк",
      author: "Ирвин Шоу",
      rating: 4.8,
      dateAdded: "2024-01-18",
      popularity: 89,
    },
    {
      id: 6,
      title: "Стена",
      author: "Жан-Поль Сартр",
      rating: 4.4,
      dateAdded: "2024-01-12",
      popularity: 65,
    },
    {
      id: 7,
      title: "Игра в бисер",
      author: "Герман Гессе",
      rating: 4.4,
      dateAdded: "2024-01-22",
      popularity: 71,
    },
  ]

  const getSortedBooks = () => {
    let sortedBooks = [...books]

    switch (sortBy) {
      case "new":
        sortedBooks.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
        break
      case "popular":
        sortedBooks.sort((a, b) => b.popularity - a.popularity)
        break
      case "rating":
        sortedBooks.sort((a, b) => b.rating - a.rating)
        break
      default:
        break
    }

    if (searchQuery.trim()) {
      sortedBooks = sortedBooks.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    return sortedBooks
  }

  const getAuthorName = (slug: string) => {
    const authors: { [key: string]: string } = {
      homer: "Гомер",
      shakespeare: "Уильям Шекспир",
      austen: "Джейн Остин",
      shelley: "Мэри Шелли",
      all: "Все авторы",
    }
    return authors[slug] || "Каталог"
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Search:", searchQuery)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <BackButton className="mr-4" />
          <div>
            <p className="text-sm text-gray-500">Все книги / Автор/{getAuthorName(params.slug)}</p>
            <h1 className="text-2xl font-bold text-gray-900">{getAuthorName(params.slug)}</h1>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Сортировать" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Новые</SelectItem>
              <SelectItem value="popular">Популярные</SelectItem>
              <SelectItem value="rating">Высокий рейтинг</SelectItem>
            </SelectContent>
          </Select>

          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Input
                type="text"
                placeholder="Поиск книги"
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

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {getSortedBooks().map((book) => (
            <Card key={book.id} className="p-4">
              <div className="flex space-x-4">
                <div className="w-20 h-28 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 text-xs text-center">Обложка</span>
                </div>
                <div className="flex-1">
                  <Link href={`/product/${book.id}`} className="hover:text-blue-600">
                    <h3 className="font-semibold text-lg mb-1">{book.title}</h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-2">{book.author}</p>
                  <div className="flex items-center space-x-1 mb-3">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">{book.rating}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button asChild size="sm" className="bg-black hover:bg-gray-800 text-white">
                      <Link href={`/product/${book.id}`}>Подробнее</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
