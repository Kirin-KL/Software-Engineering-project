"use client"

import { Button } from "@/components/ui/button"
import { LogOut, Users, BookOpen, MessageSquare, BarChart3 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AdminHeader() {
  const pathname = usePathname()

  const handleLogout = () => {
    if (confirm("Вы уверены, что хотите выйти?")) {
      window.location.href = "/"
    }
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/admin" className="flex items-center space-x-2">
            <div className="flex flex-col">
              <div className="w-6 h-0.5 bg-black mb-0.5"></div>
              <div className="w-6 h-0.5 bg-black mb-0.5"></div>
              <div className="w-6 h-0.5 bg-black"></div>
            </div>
            <span className="text-xl font-bold text-black">КнигаЪ</span>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Admin</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/admin"
              className={`font-medium flex items-center space-x-2 ${
                isActive("/admin") ? "text-gray-900 border-b-2 border-black pb-4" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Дашборд</span>
            </Link>

            <Link
              href="/admin/books"
              className={`font-medium flex items-center space-x-2 ${
                isActive("/admin/books")
                  ? "text-gray-900 border-b-2 border-black pb-4"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Книги</span>
            </Link>

            <Link
              href="/admin/users"
              className={`font-medium flex items-center space-x-2 ${
                isActive("/admin/users")
                  ? "text-gray-900 border-b-2 border-black pb-4"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Пользователи</span>
            </Link>

            <Link
              href="/admin/reviews"
              className={`font-medium flex items-center space-x-2 ${
                isActive("/admin/reviews")
                  ? "text-gray-900 border-b-2 border-black pb-4"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Отзывы</span>
            </Link>
          </nav>

          {/* Logout */}
          <Button onClick={handleLogout} variant="outline" className="flex items-center space-x-2">
            <LogOut className="h-4 w-4" />
            <span>Выход</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
