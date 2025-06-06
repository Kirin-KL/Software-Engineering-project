"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Check, X, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  })
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (formData.password && formData.confirmPassword) {
      setPasswordMatch(formData.password === formData.confirmPassword)
    } else {
      setPasswordMatch(null)
    }
  }, [formData.password, formData.confirmPassword])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    console.log('Form submitted with data:', { ...formData, password: '***' })

    // Validation
    if (
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.confirmPassword.trim()
    ) {
      setError("Пожалуйста, заполните все поля")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Пожалуйста, введите корректный email")
      return
    }

    if (formData.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают")
      return
    }

    try {
      setIsLoading(true)
      console.log('Attempting to register user...')
      
      const response = await api.register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      })
      
      console.log('Registration successful:', response)
      alert("Регистрация успешна! Теперь вы можете войти в систему.")
      router.push('/')
    } catch (err) {
      console.error('Registration failed:', err)
      setError(err instanceof Error ? err.message : 'Произошла ошибка при регистрации')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
            <h1 className="text-2xl font-bold text-gray-900 mb-8">РЕГИСТРАЦИЯ</h1>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm text-gray-600">
                Имя пользователя
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Введите имя пользователя"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-600">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="email@example.com"
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
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm text-gray-600">
                Подтвердите пароль
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    passwordMatch === null
                      ? "border-gray-300"
                      : passwordMatch
                      ? "border-green-500"
                      : "border-red-500"
                  }`}
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {passwordMatch !== null && (
                    <span className={passwordMatch ? "text-green-500" : "text-red-500"}>
                      {passwordMatch ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </span>
                  )}
                </div>
              </div>
              {passwordMatch !== null && !passwordMatch && (
                <p className="text-sm text-red-500 mt-1">Пароли не совпадают</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-md font-medium transition-colors"
              disabled={passwordMatch === false || isLoading}
            >
              {isLoading ? "РЕГИСТРАЦИЯ..." : "ЗАРЕГИСТРИРОВАТЬСЯ"}
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
              </div>
            </div>

            <div className="text-right">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                Уже есть аккаунт? Войти
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
