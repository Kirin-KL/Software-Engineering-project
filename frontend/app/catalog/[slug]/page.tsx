"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Book {
  id: number
  title: string
  author: string
  description: string
  cover_url: string
  rating: number
  price: number
}

export default function CategoryPage() {
  const params = useParams()
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState("")

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true)
        const data = await api.getBooksByCategory(params.slug as string)
        setBooks(data.books)
        setCategoryName(data.category_name)
      } catch (err) {
        console.error('Error fetching books:', err)
        setError('Не удалось загрузить книги')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooks()
  }, [params.slug])

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{categoryName}</h1>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="w-full">
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/4" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <Card key={book.id} className="w-full">
              <CardHeader>
                <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                <CardDescription>{book.author}</CardDescription>
              </CardHeader>
              <CardContent>
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-48 object-cover rounded-md"
                />
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="text-lg font-semibold">{book.price} ₽</div>
                <Button variant="outline">Подробнее</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 