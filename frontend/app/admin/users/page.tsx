"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Mail, Calendar, MessageSquare, Ban, CheckCircle, Heart } from "lucide-react"
import AdminHeader from "@/components/admin-header"

interface User {
  id: number
  name: string
  email: string
  registrationDate: string
  status: "active" | "blocked" | "pending"
  readingActivity: number // Replaced ordersCount with readingActivity
  reviewsCount: number
  lastActivity: string
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "Книжный червь",
      email: "user1@example.com",
      registrationDate: "2024-01-15",
      status: "active",
      readingActivity: 15, // Example reading activity
      reviewsCount: 12,
      lastActivity: "2024-01-22",
    },
    {
      id: 2,
      name: "Наталья",
      email: "natasha@example.com",
      registrationDate: "2024-01-10",
      status: "active",
      readingActivity: 8, // Example reading activity
      reviewsCount: 8,
      lastActivity: "2024-01-21",
    },
    {
      id: 3,
      name: "Александр",
      email: "alex@example.com",
      registrationDate: "2024-01-20",
      status: "pending",
      readingActivity: 0, // Example reading activity
      reviewsCount: 0,
      lastActivity: "2024-01-20",
    },
    {
      id: 4,
      name: "Мария",
      email: "maria@example.com",
      registrationDate: "2024-01-12",
      status: "blocked",
      readingActivity: 2, // Example reading activity
      reviewsCount: 1,
      lastActivity: "2024-01-18",
    },
    {
      id: 5,
      name: "Дмитрий",
      email: "dmitry@example.com",
      registrationDate: "2024-01-08",
      status: "active",
      readingActivity: 20, // Example reading activity
      reviewsCount: 15,
      lastActivity: "2024-01-22",
    },
  ])

  const getFilteredUsers = () => {
    if (!searchQuery.trim()) return users

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }

  const handleBlockUser = (id: number) => {
    if (confirm("Вы уверены, что хотите заблокировать этого пользователя?")) {
      setUsers(users.map((user) => (user.id === id ? { ...user, status: "blocked" as const } : user)))
    }
  }

  const handleUnblockUser = (id: number) => {
    setUsers(users.map((user) => (user.id === id ? { ...user, status: "active" as const } : user)))
  }

  const handleActivateUser = (id: number) => {
    setUsers(users.map((user) => (user.id === id ? { ...user, status: "active" as const } : user)))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "blocked":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Активен"
      case "blocked":
        return "Заблокирован"
      case "pending":
        return "Ожидает активации"
      default:
        return "Неизвестно"
    }
  }

  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.status === "active").length
  const blockedUsers = users.filter((u) => u.status === "blocked").length
  const pendingUsers = users.filter((u) => u.status === "pending").length

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Управление пользователями</h1>
          <p className="text-gray-600">Просмотр и управление учетными записями пользователей</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-sm text-gray-600">Всего пользователей</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
                <p className="text-sm text-gray-600">Активных</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{blockedUsers}</p>
                <p className="text-sm text-gray-600">Заблокированных</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{pendingUsers}</p>
                <p className="text-sm text-gray-600">Ожидают активации</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Input
              type="text"
              placeholder="Поиск пользователей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Все пользователи ({getFilteredUsers().length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getFilteredUsers().map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Регистрация: {user.registrationDate}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>Активность: {user.lastActivity}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Heart className="h-4 w-4" />
                        <span className="text-sm">{user.readingActivity}</span>
                      </div>
                      <p className="text-xs text-gray-500">В списке чтения</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm">{user.reviewsCount}</span>
                      </div>
                      <p className="text-xs text-gray-500">Отзывов</p>
                    </div>

                    <Badge className={getStatusColor(user.status)}>{getStatusText(user.status)}</Badge>

                    <div className="flex space-x-2">
                      {user.status === "active" && (
                        <Button
                          onClick={() => handleBlockUser(user.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      {user.status === "blocked" && (
                        <Button
                          onClick={() => handleUnblockUser(user.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {user.status === "pending" && (
                        <Button
                          onClick={() => handleActivateUser(user.id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
