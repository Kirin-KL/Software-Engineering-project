"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Star, MessageSquare } from "lucide-react"
import Link from "next/link"
import { api, Review, Book, UserData } from "@/lib/api"

export default function HeroSlider() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [recommendations, setRecommendations] = useState<Book[] | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api.getUserData();
        setUserData(data);
      } catch (e) {
        setUserData(null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Пробуем получить рекомендации
        const recs = await api.getRecommendations(userData!.id)
        if (recs && recs.length > 0) {
          setRecommendations(recs)
          setIsLoading(false)
          return
        }
      } catch (e) {
        console.log('Ошибка при получении рекомендаций:', e)
      }
      // Если нет рекомендаций — показываем отзывы
      const allReviews = await api.getReviews(0, 20)
      const topReviews = allReviews.filter(r => r.rating >= 4).slice(0, 3)
      setReviews(topReviews)
      setIsLoading(false)
    }
    if (userData?.id) fetchData()
  }, [userData?.id])

  const nextSlide = () => {
    if (recommendations && recommendations.length > 0) {
      setCurrentSlide((prev: number) => (prev + 1) % recommendations.length)
    } else {
      setCurrentSlide((prev: number) => (prev + 1) % reviews.length)
    }
  }

  const prevSlide = () => {
    if (recommendations && recommendations.length > 0) {
      setCurrentSlide((prev: number) => (prev - 1 + recommendations.length) % recommendations.length)
    } else {
      setCurrentSlide((prev: number) => (prev - 1 + reviews.length) % reviews.length)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Auto-advance slides
  useEffect(() => {
    const length = recommendations && recommendations.length > 0 ? recommendations.length : reviews.length
    if (length > 0) {
      const timer = setInterval(nextSlide, 5000)
      return () => clearInterval(timer)
    }
  }, [recommendations, reviews])

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-lg mb-8 h-64 bg-gray-100 animate-pulse">
      </div>
    )
  }

  if (recommendations && recommendations.length > 0) {
    // Слайдер с рекомендациями
    return (
      <div className="relative overflow-hidden rounded-lg mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-900">Персональные рекомендации</h2>
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {recommendations.map((book) => (
            <Link key={book.id} href={`/product/${book.id}`} className="w-full flex-shrink-0">
              <div className="w-full bg-gradient-to-r from-blue-900 to-blue-800 text-white p-8 relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                <div className="grid grid-cols-3 gap-8 px-16">
                  {/* Левая часть с книгой */}
                  <div className="col-span-2 flex flex-col justify-center">
                    <h2 className="text-3xl font-bold mb-4">{book.title}</h2>
                    <p className="text-gray-300 mb-6 line-clamp-3">{book.description}</p>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-400">Автор:</span>
                      <span className="text-sm">{book.author}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-lg">{book.average_rating?.toFixed(1) ?? '-'}</span>
                    </div>
                  </div>
                  {/* Правая часть с обложкой */}
                  <div className="flex flex-col justify-center items-center">
                    {book.image_url ? (
                      <img src={`/books/${book.image_url}`} alt={book.title} className="w-32 h-48 object-cover rounded shadow" />
                    ) : (
                      <div className="w-32 h-48 bg-gray-700 flex items-center justify-center rounded">Нет обложки</div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {/* Navigation arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all z-10"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all z-10"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
        {/* Dots indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {recommendations.map((_, index: number) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-white"
                  : "bg-white bg-opacity-50 hover:bg-opacity-75"
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  if (reviews.length > 0) {
    // Слайдер с отзывами
    return (
      <div className="relative overflow-hidden rounded-lg mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Лучшие отзывы пользователей</h2>
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {reviews.map((review) => (
            <Link key={review.id} href={`/review/${review.id}`} className="w-full flex-shrink-0">
              <div className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                <div className="grid grid-cols-3 gap-8 px-16">
                  {/* Левая часть с отзывом */}
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2 mb-4">
                      <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-lg">5.0</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">{review.title}</h2>
                    <p className="text-gray-300 mb-6 line-clamp-3">{review.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm">{review.comments.length} комментариев</span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(review.created_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  {/* Правая часть с информацией о книге */}
                  {review.book && (
                    <div className="flex flex-col justify-center">
                      <div className="border-l-4 border-yellow-400 pl-4">
                        <h3 className="text-lg font-semibold mb-1">{review.book.title}</h3>
                        <p className="text-gray-300 text-sm mb-2">{review.book.author}</p>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{review.book.average_rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        {/* Navigation arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all z-10"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all z-10"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
        {/* Dots indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {reviews.map((_, index: number) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-white"
                  : "bg-white bg-opacity-50 hover:bg-opacity-75"
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  return null
}
