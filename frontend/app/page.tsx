"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, Camera, Upload, X } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/dashboard'
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showBiometricModal, setShowBiometricModal] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [biometricStep, setBiometricStep] = useState<"request" | "camera" | "captured">("request")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    console.log('Начало процесса входа...')

    // Simple validation - check if fields are not empty
    if (email.trim() === "" || password.trim() === "") {
      console.log('Ошибка валидации: пустые поля')
      setError("Пожалуйста, заполните все поля")
      setIsLoading(false)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Ошибка валидации: некорректный email')
      setError("Пожалуйста, введите корректный email")
      setIsLoading(false)
      return
    }

    // Simple password validation (minimum 6 characters)
    if (password.length < 6) {
      console.log('Ошибка валидации: пароль слишком короткий')
      setError("Пароль должен содержать минимум 6 символов")
      setIsLoading(false)
      return
    }

    console.log('Валидация пройдена успешно, отправка запроса на сервер...')
    try {
      await api.login({ email, password })
      router.push(from)
    } catch (err) {
      console.error('Ошибка при входе:', err)
      setError(err instanceof Error ? err.message : 'Произошла ошибка при входе')
    } finally {
      setIsLoading(false)
      console.log('Процесс входа завершен')
    }
  }

  const handleBiometrics = () => {
    setShowBiometricModal(true)
    setBiometricStep("request")
  }

  const requestCameraAccess = async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      })

      setCameraStream(stream)
      setBiometricStep("camera")

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error("Camera access error:", error)
      setCameraError("Не удалось получить доступ к камере. Проверьте разрешения браузера.")
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        const imageData = canvas.toDataURL("image/jpeg", 0.8)
        setCapturedImage(imageData)
        setBiometricStep("captured")

        // Stop camera stream
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop())
          setCameraStream(null)
        }
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string)
        setBiometricStep("captured")

        // Stop camera stream if active
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop())
          setCameraStream(null)
        }
      }
      reader.readAsDataURL(file)
    } else {
      alert("Пожалуйста, выберите изображение")
    }
  }

  const handleBiometricLogin = () => {
    if (capturedImage) {
      console.log("Biometric login successful with image:", capturedImage)
      // Simulate biometric verification
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1000)
    }
  }

  const closeBiometricModal = () => {
    setShowBiometricModal(false)
    setBiometricStep("request")
    setCapturedImage(null)
    setCameraError(null)

    // Stop camera stream if active
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setBiometricStep("request")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">ВХОД В СИСТЕМУ</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-600">
                Укажите вашу почту
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email"
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

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-md font-medium transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "ВХОД..." : "ВОЙТИ"}
              </Button>

              <Button
                type="button"
                onClick={handleBiometrics}
                className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-md font-medium transition-colors"
              >
                БИОМЕТРИЯ
              </Button>

              <Link href="/admin/login" className="block w-full">
                <Button
                  type="button"
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-md font-medium transition-colors"
                >
                  ВХОД ДЛЯ АДМИНИСТРАТОРА
                </Button>
              </Link>
            </div>
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

            <p className="text-sm text-gray-500">
              Нет аккаунта?{" "}
              <Link href="/register" className="text-black hover:underline font-medium">
                Зарегистрируйтесь здесь
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Biometric Authentication Modal */}
      {showBiometricModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Биометрическая аутентификация</h3>
                <button onClick={closeBiometricModal} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              {biometricStep === "request" && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Доступ к камере</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Для биометрической аутентификации необходимо разрешить доступ к камере или загрузить фотографию.
                    </p>
                  </div>

                  {cameraError && <p className="text-sm text-red-600 mb-4">{cameraError}</p>}

                  <div className="space-y-3">
                    <Button onClick={requestCameraAccess} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Camera className="h-4 w-4 mr-2" />
                      Использовать камеру
                    </Button>

                    <div className="relative">
                      <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Загрузить фото
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {biometricStep === "camera" && (
                <div className="text-center space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 bg-gray-200 rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-40 border-2 border-white rounded-lg"></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Расположите лицо в рамке и нажмите кнопку</p>
                  <div className="space-y-2">
                    <Button onClick={capturePhoto} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Camera className="h-4 w-4 mr-2" />
                      Сделать снимок
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Загрузить фото
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {biometricStep === "captured" && capturedImage && (
                <div className="text-center space-y-4">
                  <div className="relative">
                    <img
                      src={capturedImage || "/placeholder.svg"}
                      alt="Captured biometric"
                      className="w-full h-64 bg-gray-200 rounded-lg object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Фотография получена</h4>
                    <p className="text-sm text-gray-600 mb-4">Проверьте качество изображения и войдите в систему</p>
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={handleBiometricLogin}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      ВОЙТИ
                    </Button>
                    <Button onClick={retakePhoto} variant="outline" className="w-full">
                      Переснять
                    </Button>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
