"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"
import { Book } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"

export default function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [book, setBook] = useState<Book | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchBook()
  }, [resolvedParams.id])

  const fetchBook = async () => {
    try {
      const bookData = await api.getBookById(resolvedParams.id)
      setBook(bookData)
    } catch (error) {
      console.error("Ошибка при загрузке книги:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить информацию о книге",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!book) return

    try {
      await api.deleteBook(book.id)
      toast({
        title: "Успех",
        description: "Книга успешно удалена",
      })
      router.push("/admin")
    } catch (error) {
      console.error("Ошибка при удалении книги:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить книгу",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Skeleton className="h-8 w-8 mr-2" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Книга не найдена</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <Button
          variant="destructive"
          onClick={handleDeleteClick}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Удалить книгу
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{book.title}</CardTitle>
          <p className="text-sm text-gray-500">Автор: {book.author}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {book.image_url && (
              <div className="mb-4">
                <img
                  src={`/books/${book.image_url}`}
                  alt={book.title}
                  className="max-w-xs rounded-lg shadow-md"
                />
              </div>
            )}
            <div>
              <h3 className="font-semibold mb-2">Описание</h3>
              <p className="text-gray-600">{book.description || "Описание отсутствует"}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Детали</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ISBN</p>
                  <p>{book.isbn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Год публикации</p>
                  <p>{book.publication_year || "Не указан"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Категория</p>
                  <p>{book.category?.name || "Не указана"}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить книгу "{book.title}"? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 