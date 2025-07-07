"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface BackButtonProps {
  fallbackUrl?: string
  className?: string
}

export default function BackButton({ fallbackUrl = "/dashboard", className = "" }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackUrl)
    }
  }

  return (
    <button onClick={handleBack} className={`text-gray-600 hover:text-gray-800 ${className}`}>
      <ArrowLeft className="h-6 w-6" />
    </button>
  )
}
