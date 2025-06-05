import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: number
}

export function StarRating({ rating, maxRating = 5, size = 16 }: StarRatingProps) {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  for (let i = 0; i < maxRating; i++) {
    if (i < fullStars) {
      stars.push(
        <Star
          key={i}
          className="fill-yellow-400 text-yellow-400"
          size={size}
        />
      )
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <Star
          key={i}
          className="fill-yellow-400 text-yellow-400"
          size={size}
        />
      )
    } else {
      stars.push(
        <Star
          key={i}
          className="text-gray-300"
          size={size}
        />
      )
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      {stars}
    </div>
  )
} 