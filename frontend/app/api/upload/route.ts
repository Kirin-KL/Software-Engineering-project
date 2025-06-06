import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Генерируем уникальное имя файла
    const uniqueId = uuidv4()
    const extension = file.name.split('.').pop()
    const fileName = `${uniqueId}.${extension}`

    // Путь для сохранения файла
    const path = join(process.cwd(), 'public/books', fileName)

    // Сохраняем файл
    await writeFile(path, buffer)

    return NextResponse.json({ 
      success: true,
      fileName: fileName
    })
  } catch (error) {
    console.error('Ошибка при загрузке файла:', error)
    return NextResponse.json(
      { error: 'Ошибка при загрузке файла' },
      { status: 500 }
    )
  }
} 