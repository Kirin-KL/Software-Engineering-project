"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ParsersPage() {
  const [maxCount, setMaxCount] = useState<number | null>(null)
  const [allLinks, setAllLinks] = useState<string[]>([])
  const [parsing, setParsing] = useState(false)
  const [parsingResult, setParsingResult] = useState<{added: number, skipped: number} | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState<string>("")

  const handleFindBooks = async () => {
    setStatus("Поиск книг...")
    setError(null)
    setParsingResult(null)
    setMaxCount(null)
    setAllLinks([])
    try {
      const data = await api.adminPreviewBooks()
      setMaxCount(data.max_count)
      setAllLinks(data.links)
      setStatus("Ссылки получены!")
    } catch (e: any) {
      setError(e.message)
      setStatus(null)
      console.error("[Парсер] Ошибка поиска:", e)
    }
  }

  const handleParseBooks = async () => {
    setParsing(true)
    setStatus("Парсинг и добавление книг...")
    setError(null)
    setParsingResult(null)
    try {
      const n = count ? Math.max(0, parseInt(count)) : allLinks.length
      const result = await api.adminParseBooksByLinks(allLinks, n)
      setParsingResult({ added: result.added, skipped: result.skipped })
      if (result.added < n) {
        setStatus(`Добавлены все уникальные книги (${result.added})`)
      } else {
        setStatus("Парсинг завершён!")
      }
    } catch (e: any) {
      setError(e.message)
      setStatus(null)
      console.error("[Парсер] Ошибка парсинга:", e)
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к панели
          </Button>
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">Парсинг книг с сайта Book24.ru</h1>
      <div className="mb-4 flex items-center gap-2">
        <Button onClick={handleFindBooks} disabled={parsing || maxCount !== null}>
          Найти книги
        </Button>
      </div>
      {status && <div className="mb-2 text-blue-600">{status}</div>}
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {maxCount !== null && (
        <div className="mb-4">Всего найдено книг: <b>{maxCount}</b></div>
      )}
      {maxCount !== null && !parsingResult && (
        <div className="mb-4 flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={maxCount}
            placeholder="Количество книг для парсинга"
            value={count}
            onChange={e => {
              const val = e.target.value
              if (/^\d*$/.test(val)) setCount(val)
            }}
            className="border rounded px-2 py-1 w-64"
            disabled={parsing}
          />
          <Button onClick={handleParseBooks} disabled={parsing || !count || parseInt(count) < 1}>
            {parsing ? "Парсинг..." : "Начать парсинг"}
          </Button>
        </div>
      )}
      {parsingResult && (
        <div className="mt-4">
          <div>Добавлено книг: <b>{parsingResult.added}</b></div>
          <div>Пропущено (уже есть): <b>{parsingResult.skipped}</b></div>
        </div>
      )}
    </div>
  )
} 