"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, Check } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import BackButton from "@/components/back-button"
import ProfileNav from "@/components/profile-nav"
import { api } from "@/lib/api"
import AuthGuard from "@/components/auth-guard"

export default function SettingsPage() {
  const [userName, setUserName] = useState("")
  const [tempUserName, setTempUserName] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [biometricFile, setBiometricFile] = useState<File | null>(null)
  const [biometricPreview, setBiometricPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const biometricInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await api.getUserData()
        setUserName(userData.username)
        setTempUserName(userData.username)
      } catch (err) {
        console.error("Error fetching user data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    localStorage.clear()
    window.location.href = "/"
  }

  const cancelLogout = () => {
    setShowLogoutConfirm(false)
  }

  const handleNameEdit = () => {
    setIsEditingName(true)
    setTempUserName(userName)
  }

  const handleNameSave = () => {
    setUserName(tempUserName)
    setIsEditingName(false)
  }

  const handleNameCancel = () => {
    setTempUserName(userName)
    setIsEditingName(false)
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith("image/")) {
        setAvatarFile(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setAvatarPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        alert("Пожалуйста, выберите изображение")
      }
    }
  }

  const handleBiometricUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith("image/")) {
        setBiometricFile(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setBiometricPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        alert("Пожалуйста, выберите изображение")
      }
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ""
    }
  }

  const removeBiometric = () => {
    setBiometricFile(null)
    setBiometricPreview(null)
    if (biometricInputRef.current) {
      biometricInputRef.current.value = ""
    }
  }

  const handleBiometricAdd = () => {
    if (biometricFile) {
      alert("Биометрические данные успешно добавлены!")
      console.log("Biometric file:", biometricFile)
    } else {
      alert("Пожалуйста, сначала загрузите изображение для биометрии")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <BackButton fallbackUrl="/profile" className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-900">Загрузка...</h1>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <BackButton fallbackUrl="/profile" className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* User Profile and Navigation */}
            <div className="lg:col-span-4">
              <Card className="p-6 mb-6">
                <ProfileNav username={userName} currentPath="/settings" />
              </Card>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Profile Section */}
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Avatar Settings */}
                      <div>
                        <h3 className="font-semibold mb-4">Аватар</h3>
                        <div className="flex flex-col items-center space-y-2">
                          <div
                            className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors overflow-hidden border-2 border-dashed border-gray-300"
                            onClick={() => avatarInputRef.current?.click()}
                          >
                            {avatarPreview ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={avatarPreview}
                                  alt="Avatar preview"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeAvatar()
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <Upload className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                          <p className="text-sm text-gray-500 text-center">
                            Нажмите или перетащите изображение
                          </p>
                        </div>
                      </div>

                      {/* Name Settings */}
                      <div>
                        <h3 className="font-semibold mb-4">Имя пользователя</h3>
                        {isEditingName ? (
                          <div className="flex space-x-2">
                            <Input
                              value={tempUserName}
                              onChange={(e) => setTempUserName(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              onClick={handleNameSave}
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button onClick={handleNameCancel} size="sm" variant="outline">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <Input value={userName} readOnly className="flex-1 bg-gray-50" />
                            <Button onClick={handleNameEdit} size="sm" variant="outline">
                              Изменить
                            </Button>
                          </div>
                        )}
                      </div>

                      <Button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white">
                        Выход
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Biometric Settings */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Биометрия</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col items-center space-y-2">
                        <div
                          className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors overflow-hidden border-2 border-dashed border-gray-300"
                          onClick={() => biometricInputRef.current?.click()}
                        >
                          {biometricPreview ? (
                            <div className="relative w-full h-full">
                              <img
                                src={biometricPreview}
                                alt="Biometric preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeBiometric()
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <Upload className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <input
                          ref={biometricInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBiometricUpload}
                          className="hidden"
                        />
                        <p className="text-sm text-gray-500 text-center">
                          Нажмите или перетащите изображение для биометрии
                        </p>
                      </div>

                      <Button
                        onClick={handleBiometricAdd}
                        className="w-full bg-black hover:bg-gray-800 text-white"
                        disabled={!biometricFile}
                      >
                        Добавить биометрию
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {showLogoutConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Card className="w-96">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Подтверждение выхода</h3>
                  <p className="text-gray-600 mb-6">Вы уверены, что хотите выйти из аккаунта?</p>
                  <div className="flex space-x-4">
                    <Button onClick={confirmLogout} className="flex-1 bg-red-500 hover:bg-red-600 text-white">
                      Выйти
                    </Button>
                    <Button onClick={cancelLogout} className="flex-1" variant="outline">
                      Отмена
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </AuthGuard>
  )
}
