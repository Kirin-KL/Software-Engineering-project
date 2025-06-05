import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-black text-white py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex flex-col">
                <div className="w-6 h-0.5 bg-white mb-0.5"></div>
                <div className="w-6 h-0.5 bg-white mb-0.5"></div>
                <div className="w-6 h-0.5 bg-white"></div>
              </div>
              <span className="text-xl font-bold">КнигаЪ</span>
            </div>
            <p className="text-gray-400 text-sm">Ваш гид в мире книг</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Навигация</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/dashboard" className="hover:text-white">
                  Главная
                </Link>
              </li>
              <li>
                <Link href="/catalog/genre/all" className="hover:text-white">
                  Каталог
                </Link>
              </li>
              <li>
                <Link href="/forum" className="hover:text-white">
                  Форум
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-white">
                  Избранное
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Аккаунт</h3>
            <div className="space-y-2">
              <Link href="/profile" className="hover:text-white">
                Личный кабинет
              </Link>
              <Link href="/settings" className="hover:text-white">
                Настройки
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Контакты</h3>
            <p className="text-gray-400 text-sm">support@kniga.ru</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
