"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Search, Star, BookOpen } from "lucide-react"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import BackButton from "@/components/back-button"
import { api, type UserData, type Favorite } from "@/lib/api"
import AuthGuard from "@/components/auth-guard"
import { useToast } from "@/hooks/use-toast"

interface ReadingStats {
  favorite: number
}

export default function ProfilePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<keyof ReadingStats>("favorite")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true)
  const [userError, setUserError] = useState<string | null>(null)
  const [favoritesError, setFavoritesError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching user data in profile page...')
        const data = await api.getUserData()
        console.log('User data received in profile page:', data)
        setUserData(data)
      } catch (err) {
        console.error('Error fetching user data:', err)
        setUserError('Не удалось загрузить данные пользователя')
      } finally {
        setIsLoading(false)
      }
    }

    const fetchFavorites = async () => {
      try {
        console.log('Fetching user favorites...')
        const data = await api.getUserFavorites()
        console.log('Favorites received:', data)
        setFavorites(data)
      } catch (err) {
        console.error('Error fetching favorites:', err)
        setFavoritesError('Не удалось загрузить избранные книги')
      } finally {
        setIsLoadingFavorites(false)
      }
    }

    fetchUserData()
    fetchFavorites()
  }, [])

  const handleRemoveFromFavorites = async (bookId: number) => {
    try {
      await api.removeFromFavorites(bookId)
      setFavorites(favorites.filter(fav => fav.book_id !== bookId))
      toast({
        title: "Успешно",
        description: "Книга удалена из избранного",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить книгу из избранного",
        variant: "destructive",
      })
    }
  }

  const readingStats: ReadingStats = {
    favorite: favorites.length,
  }

  const filterLabels = {
    favorite: "Избранное",
  }

  const getFilteredBooks = () => {
    let filteredBooks = favorites.filter((favorite) => activeFilter === "favorite")

    if (searchQuery.trim()) {
      filteredBooks = filteredBooks.filter(
        (favorite) =>
          favorite.book?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          favorite.book?.author.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    return filteredBooks
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const filteredBooks = getFilteredBooks()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <BackButton className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-900">Личный кабинет</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* User Profile and Navigation */}
            <div className="lg:col-span-4">
              <Card className="p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600">👤</span>
                    </div>
                    <span className="font-medium">
                      {isLoading ? 'Загрузка...' : userError ? userError : userData?.username || 'Гость'}
                    </span>
                  </div>
                  <div className="flex space-x-6 text-sm text-gray-600">
                    <Link href="/profile/reviews" className="hover:text-gray-900">
                      Отзывы
                    </Link>
                    <Link href="/settings" className="flex items-center space-x-1 hover:text-gray-900">
                      <Settings className="h-4 w-4" />
                      <span>Настройки</span>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>

            {/* Reading Statistics Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Списки</h3>
                <div className="space-y-2">
                  {Object.entries(readingStats).map(([key, count]) => (
                    <button
                      key={key}
                      onClick={() => setActiveFilter(key as keyof ReadingStats)}
                      className={`w-full flex items-center justify-between p-2 rounded text-sm ${
                        activeFilter === key ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex-1">{filterLabels[key as keyof ReadingStats]}</span>
                      <span className="text-gray-500 ml-4">{count}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Books Content */}
            <div className="lg:col-span-3">
              {/* Search */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative max-w-md">
                  <Input
                    type="text"
                    placeholder="Поиск книги или автора..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-4 pr-10"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Search className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
                {searchQuery && (
                  <p className="text-sm text-gray-500 mt-2">
                    {filteredBooks.length > 0
                      ? `Найдено ${filteredBooks.length} результатов по запросу "${searchQuery}"`
                      : `По запросу "${searchQuery}" ничего не найдено`}
                  </p>
                )}
              </form>

              {/* Books Grid - Fixed height container */}
              <div className="min-h-[600px]">
                {isLoadingFavorites ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Загрузка избранных книг...</p>
                  </div>
                ) : favoritesError ? (
                  <div className="text-center py-12">
                    <p className="text-red-500 mb-4">{favoritesError}</p>
                    <Link href="/dashboard">
                      <Button className="bg-black hover:bg-gray-800 text-white">Перейти к покупкам</Button>
                    </Link>
                  </div>
                ) : filteredBooks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBooks.map((favorite) => (
                      <Card key={favorite.id} className="p-4 h-fit">
                        <div className="flex flex-col">
                          <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
                            {favorite.book?.image_url ? (
                              <img 
                                src={favorite.book.image_url.startsWith('http') ? favorite.book.image_url : `/books/${favorite.book.image_url}`}
                                alt={`Обложка книги ${favorite.book.title}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <BookOpen className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <Link href={`/product/${favorite.book_id}`} className="hover:text-blue-600">
                              <h3 className="font-semibold text-lg mb-1 line-clamp-2">{favorite.book?.title}</h3>
                            </Link>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-1">{favorite.book?.author}</p>
                            <div className="flex items-center space-x-1 mb-3">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600">{favorite.book?.average_rating.toFixed(1)}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveFromFavorites(favorite.book_id)}
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Удалить из избранного
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    {searchQuery ? (
                      <>
                        <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">По запросу "{searchQuery}" ничего не найдено</p>
                        <Button onClick={() => setSearchQuery("")} variant="outline" className="mr-4">
                          Очистить поиск
                        </Button>
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">В этом списке пока нет книг</p>
                        <Link href="/dashboard">
                          <Button className="bg-black hover:bg-gray-800 text-white">
                            На главную
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </AuthGuard>
  )
}
