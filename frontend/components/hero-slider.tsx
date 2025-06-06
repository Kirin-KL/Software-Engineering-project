"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Star, MessageSquare } from "lucide-react"
import Link from "next/link"
import { api, Review } from "@/lib/api"

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Получаем больше отзывов, чтобы выбрать лучшие
        const allReviews = await api.getReviews(0, 20)
        // Фильтруем только отзывы с 5 звездами и берем первые 3
        const topReviews = allReviews
          .filter(review => review.rating === 5)
          .slice(0, 3)
        setReviews(topReviews)
      } catch (error) {
        console.error('Error fetching reviews:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev: number) => (prev + 1) % reviews.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev: number) => (prev - 1 + reviews.length) % reviews.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Auto-advance slides
  useEffect(() => {
    if (reviews.length > 0) {
      const timer = setInterval(nextSlide, 5000)
      return () => clearInterval(timer)
    }
  }, [reviews])

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-lg mb-8 h-64 bg-gray-100 animate-pulse" />
    )
  }

  if (reviews.length === 0) {
    return null
  }

  return (
    <div className="relative overflow-hidden rounded-lg mb-8 h-[300px]">
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {reviews.map((review) => (
          <Link key={review.id} href={`/review/${review.id}`} className="w-full flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
              <div className="grid grid-cols-3 gap-8 px-16 h-full">
                {/* Левая часть с отзывом */}
                <div className="col-span-2 flex flex-col">
                  <div className="flex items-center space-x-2 mb-4">
                    <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-lg">5.0</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-4 line-clamp-2">{review.title}</h2>
                  <p className="text-gray-300 mb-6 line-clamp-3 flex-grow">{review.content}</p>
                  <div className="flex items-center justify-between mt-auto">
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
                      <h3 className="text-lg font-semibold mb-1 line-clamp-2">{review.book.title}</h3>
                      <p className="text-gray-300 text-sm mb-2 line-clamp-1">{review.book.author}</p>
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
