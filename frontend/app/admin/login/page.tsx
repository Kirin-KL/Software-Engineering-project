"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Проверка на пустые поля
      if (email.trim() === "" || password.trim() === "") {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, заполните все поля",
          variant: "destructive",
        })
        return
      }

      // Проверка формата email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, введите корректный email",
          variant: "destructive",
        })
        return
      }

      // Проверка длины пароля
      if (password.length < 6) {
        toast({
          title: "Ошибка",
          description: "Пароль должен содержать минимум 6 символов",
          variant: "destructive",
        })
        return
      }

      // Используем основную систему аутентификации
      const response = await api.login({
        email: email.trim(),
        password: password.trim()
      })
      
      console.log('Ответ сервера:', response)
      
      // Проверяем только email администратора
      if (email.trim() === "admin@bookbi.ru") {
        console.log('Перенаправление на панель администратора')
        // Перенаправляем на панель администратора
        window.location.href = "/admin"
      } else {
        console.log('Пользователь не является администратором')
        toast({
          title: "Ошибка",
          description: "У вас нет доступа к панели администратора",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Ошибка входа:', error)
      toast({
        title: "Ошибка входа",
        description: error instanceof Error ? error.message : "Неверные учетные данные",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex items-center mb-4">
              <Link href="/" className="text-gray-600 hover:text-gray-800">
                <ArrowLeft className="h-6 w-6" />
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ВХОД АДМИНИСТРАТОРА</h1>
            <p className="text-sm text-gray-600">Панель управления BookBI</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-600">
                Email администратора
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bookbi.ru"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-gray-600">
                Пароль
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-md font-medium transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "ВХОД..." : "ВОЙТИ В ПАНЕЛЬ УПРАВЛЕНИЯ"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2">
                <div className="flex flex-col">
                  <div className="w-8 h-1 bg-black mb-1"></div>
                  <div className="w-8 h-1 bg-black mb-1"></div>
                  <div className="w-8 h-1 bg-black"></div>
                </div>
                <span className="text-2xl font-bold text-black ml-2">КнигаЪ</span>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Admin</span>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Обычный пользователь?{" "}
              <Link href="/" className="text-black hover:underline font-medium">
                Войти как пользователь
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
