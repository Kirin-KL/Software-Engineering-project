"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    // Simple validation - check if fields are not empty
    if (email.trim() === "" || password.trim() === "") {
      alert("Пожалуйста, заполните все поля")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert("Пожалуйста, введите корректный email")
      return
    }

    // Simple password validation (minimum 6 characters)
    if (password.length < 6) {
      alert("Пароль должен содержать минимум 6 символов")
      return
    }

    // Admin credentials check (you can customize this)
    if (email === "admin@bookbi.ru" && password === "admin123") {
      console.log("Admin login successful:", { email, password })
      window.location.href = "/admin"
    } else {
      alert("Неверные учетные данные")
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-md font-medium transition-colors"
            >
              ВОЙТИ В ПАНЕЛЬ УПРАВЛЕНИЯ
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
