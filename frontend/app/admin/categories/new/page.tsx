"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function CreateCategoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!name.trim()) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, введите название категории",
          variant: "destructive",
        })
        return
      }

      await api.createCategory({ name: name.trim() })
      toast({
        title: "Успех",
        description: "Категория успешно создана",
      })
      router.push("/admin")
    } catch (error) {
      console.error("Ошибка при создании категории:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось создать категорию",
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
          <CardTitle>Добавить новую категорию</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название категории *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Введите название категории"
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Создание..." : "Создать категорию"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 