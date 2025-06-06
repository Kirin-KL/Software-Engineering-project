"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Book, Category } from "@/lib/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { StarRating } from "@/components/star-rating"
import Link from "next/link"
import { Search, BookOpen, Calendar, Star, Grid, List, Tag } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Image from 'next/image'

export default function CatalogPage() {
  const [mounted, setMounted] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "rating" | "title">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
    fetchBooks()
    fetchCategories()
  }, [])

  const fetchBooks = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getLatestBooks(100)
      setBooks(response)
    } catch (err) {
      setError("Не удалось загрузить книги. Пожалуйста, попробуйте позже.")
      console.error("Error fetching books:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories()
      setCategories(response)
    } catch (err) {
      console.error("Error fetching categories:", err)
    }
  }

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === null || book.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return sortOrder === "asc" 
          ? new Date(a.publication_year || 0).getTime() - new Date(b.publication_year || 0).getTime()
          : new Date(b.publication_year || 0).getTime() - new Date(a.publication_year || 0).getTime()
      case "rating":
        return sortOrder === "asc"
          ? (a.average_rating || 0) - (b.average_rating || 0)
          : (b.average_rating || 0) - (a.average_rating || 0)
      case "title":
        return sortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      default:
        return 0
    }
  })

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-4 mb-8">
            <Skeleton className="h-10 w-full max-w-md" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="flex-grow">
                  <Skeleton className="h-48 w-full mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
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
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
            <Button onClick={fetchBooks} variant="outline">
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
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Поиск по названию или автору..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={sortBy} onValueChange={(value: "date" | "rating" | "title") => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Сортировать по" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Дате публикации</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="rating">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span>Рейтингу</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="title">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Названию</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={selectedCategory?.toString() || "all"} 
                onValueChange={(value) => setSelectedCategory(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span>Все категории</span>
                    </div>
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "По возрастанию" : "По убыванию"}
              </Button>
            </div>
          </div>

          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]"
            : "flex flex-col gap-4 min-h-[400px]"
          }>
            {sortedBooks.length > 0 ? (
              sortedBooks.map((book) => (
                <Link href={`/product/${book.id}`} key={book.id}>
                  <Card className={viewMode === "grid" 
                    ? "h-[460px] hover:shadow-lg transition-shadow duration-200 flex flex-col"
                    : "hover:shadow-lg transition-shadow duration-200 flex flex-row h-[220px]"
                  }>
                    <div className={viewMode === "grid" ? "w-full" : "w-[200px] flex-none"}>
                      <div className={viewMode === "grid" 
                        ? "w-full h-[260px] bg-gray-200 rounded-lg flex items-center justify-center mb-2"
                        : "w-full h-full bg-gray-200 rounded-l-lg flex items-center justify-center"
                      }>
                        <div className="relative aspect-[3/4] w-full h-full overflow-hidden rounded-lg">
                          {book.image_url ? (
                            <Image
                              src={`/books/${book.image_url}`}
                              alt={`Обложка книги ${book.title}`}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover"
                              priority={false}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <BookOpen className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={viewMode === "grid" ? "flex-grow" : "flex-grow p-4 flex flex-col"}>
                      <CardHeader className={viewMode === "grid" ? "flex-none p-2" : "flex-none p-0 mb-1"}>
                        <CardTitle className="line-clamp-2 text-lg mb-1">{book.title}</CardTitle>
                        <CardDescription className="line-clamp-1">{book.author}</CardDescription>
                      </CardHeader>
                      <CardContent className={viewMode === "grid" 
                        ? "flex-grow flex flex-col p-2 pt-0"
                        : "flex-grow flex flex-col p-0"
                      }>
                        <div className="flex items-center gap-2 mb-1 flex-none h-[24px]">
                          <StarRating rating={book.average_rating || 0} />
                          <span className="text-sm text-gray-500">
                            {book.average_rating ? book.average_rating.toFixed(1) : "Нет оценок"}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className={viewMode === "grid" 
                        ? "flex-none p-2 pt-0"
                        : "flex-none p-0 mt-auto"
                      }>
                        <div className="w-full">
                          <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
                            <span>Год: {book.publication_year}</span>
                          </div>
                          <Button className="w-full">Подробнее</Button>
                        </div>
                      </CardFooter>
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full flex items-center justify-center h-[400px]">
                <p className="text-gray-500 text-lg">Книги не найдены</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
