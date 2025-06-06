"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface Category {
  id: number
  name: string
}

export default function CreateBookPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.getCategories()
        setCategories(data)
      } catch (error) {
        console.error("Ошибка при загрузке категорий:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить категории",
          variant: "destructive",
        })
      }
    }

    fetchCategories()
  }, [toast])

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    isbn: "",
    publication_year: "",
    image_url: "",
    category_id: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Проверяем наличие обязательных полей
      if (!formData.title || !formData.author || !formData.isbn) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, заполните все обязательные поля",
          variant: "destructive",
        })
        return
      }

      // Преобразуем числовые поля
      const bookData = {
        ...formData,
        publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
      }

      await api.createBook(bookData)
      toast({
        title: "Успех",
        description: "Книга успешно создана",
      })
      router.push("/admin")
    } catch (error) {
      console.error("Ошибка при создании книги:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось создать книгу",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Добавить новую книгу</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Название *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="author">Автор *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, author: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="isbn">ISBN *</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isbn: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="publication_year">Год публикации</Label>
                <Input
                  id="publication_year"
                  type="number"
                  value={formData.publication_year}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      publication_year: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="image_url">Имя файла изображения</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      image_url: e.target.value,
                    }))
                  }
                  placeholder="Например: book-cover.jpg"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Категория</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      category_id: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Создание..." : "Создать книгу"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 