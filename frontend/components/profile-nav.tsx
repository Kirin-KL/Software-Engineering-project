import Link from "next/link"
import { Settings } from "lucide-react"

interface ProfileNavProps {
  username: string
  currentPath: string
}

export default function ProfileNav({ username, currentPath }: ProfileNavProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-gray-600">👤</span>
        </div>
        <span className="font-medium">{username}</span>
      </div>
      <div className="flex space-x-6 text-sm text-gray-600">
        <Link
          href="/forum"
          className={`hover:text-gray-900 ${currentPath === "/forum" ? "border-b-2 border-black pb-1" : ""}`}
        >
          Отзывы
        </Link>
        <Link
          href="/settings"
          className={`flex items-center space-x-1 hover:text-gray-900 ${
            currentPath === "/settings" ? "border-b-2 border-black pb-1" : ""
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Настройки</span>
        </Link>
      </div>
    </div>
  )
} 