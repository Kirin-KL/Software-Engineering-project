"use client"

import type React from "react"
import { useState } from "react"
import { User, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, logout } = useAuth()

  const isActive = (path: string) => {
    return pathname === path
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault()
      router.push("/")
    }
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex flex-col">
              <div className="w-6 h-0.5 bg-black mb-0.5"></div>
              <div className="w-6 h-0.5 bg-black mb-0.5"></div>
              <div className="w-6 h-0.5 bg-black"></div>
            </div>
            <span className="text-xl font-bold text-black">КнигаЪ</span>
          </Link>

          {/* Навигация */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/dashboard"
              className={`font-medium ${
                isActive("/dashboard")
                  ? "text-black"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Главная
            </Link>
            <Link
              href="/catalog/"
              className={`font-medium ${
                isActive("/catalog/")
                  ? "text-black"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Каталог
            </Link>
            <Link
              href="/forum"
              className={`font-medium ${
                isActive("/forum")
                  ? "text-black"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Форум
            </Link>
          </nav>

          {/* Пользовательски действия */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="text-gray-600 hover:text-gray-900"
                  onClick={handleProfileClick}
                >
                  <User className="h-6 w-6" />
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline">Выйти</span>
                </button>
              </>
            ) : (
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
