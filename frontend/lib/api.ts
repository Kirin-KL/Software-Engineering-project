const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

interface RegisterData {
  email: string
  username: string
  password: string
}

interface RegisterResponse {
  id: number
  email: string
  username: string
  is_active: boolean
  is_superuser: boolean
  is_verified: boolean
}

interface LoginData {
  email: string
  password: string
}

interface LoginResponse {
  access_token: string
  is_admin: boolean
  user: {
    id: number
    email: string
    username: string
    is_active: boolean
    is_superuser: boolean
    is_verified: boolean
  }
}

export interface UserData {
  id: number
  username: string
  email: string
  is_active: boolean
  is_superuser: boolean
}

export interface Category {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Book {
  id: number
  title: string
  author: string
  description: string | null
  isbn: string
  publication_year: number | null
  is_available: boolean
  owner_id: number | null
  created_at: string
  updated_at: string
  category_id: number | null
  total_copies: number
  available_copies: number
  average_rating: number
  category?: {
    id: number
    name: string
    slug: string
  }
}

export interface CategoryBooksResponse {
  category_name: string
  books: Book[]
}

export interface Review {
  id: number
  title: string
  content: string
  rating: number
  created_at: string
  updated_at: string
  user_id: number
  book_id: number
  book: {
    id: number
    title: string
    author: string
    average_rating: number
    image_url?: string
  }
  comments: Array<{
    id: number
    content: string
    created_at: string
    updated_at: string
    user_id: number
    review_id: number
  }>
}

export interface Comment {
  id: number
  content: string
  created_at: string
  user_id: number
  review_id: number
}

export interface Favorite {
  id: number
  user_id: number
  book_id: number
  created_at: string
  updated_at: string
  book?: Book
}

export interface UserInfo {
  id: number
  username: string
  email: string
  is_active: boolean
  is_superuser: boolean
}

interface ReviewCreate {
  book_id: number;
  rating: number;
  title: string;
  content: string;
}

export interface ReviewResponse {
  id: number;
  title: string;
  content: string;
  rating: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  book_id: number;
  book: {
    id: number;
    title: string;
    author: string;
    average_rating: number;
  };
  comments: Array<{
    id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: number;
    review_id: number;
  }>;
}

interface BookCreate {
  title: string
  author: string
  description: string | null
  isbn: string
  publication_year: number | null
  image_url: string | null
  category_id: number | null
  total_copies: number
  available_copies: number
}

interface CategoryCreate {
  name: string
}

export const api = {
  async register(data: RegisterData): Promise<RegisterResponse> {
    console.log('Sending registration request to:', `${API_URL}/v1/auth/register`)
    console.log('Registration data:', { ...data, password: '***' })

    try {
      const response = await fetch(`${API_URL}/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      console.log('Response status:', response.status)
      const responseData = await response.json()
      console.log('Response data:', responseData)

      if (!response.ok) {
        throw new Error(responseData.detail || 'Ошибка при регистрации')
      }

      return responseData
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  },

  async login(data: LoginData): Promise<LoginResponse> {
    console.log('Отправка запроса на:', `${API_URL}/v1/auth/login`)
    console.log('Данные для входа:', { email: data.email, password: '***' })

    try {
      const response = await fetch(`${API_URL}/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        }),
      })

      console.log('Статус ответа:', response.status)
      const responseData = await response.json()
      console.log('Данные ответа:', responseData)

      if (!response.ok) {
        // Обработка ошибок валидации (422)
        if (response.status === 422) {
          const errorMessage = Array.isArray(responseData.detail) 
            ? responseData.detail[0].msg 
            : responseData.detail || 'Ошибка валидации'
          throw new Error(errorMessage)
        }
        // Обработка других ошибок
        throw new Error(responseData.detail || 'Ошибка при входе')
      }

      if (responseData.access_token) {
        localStorage.setItem('access_token', responseData.access_token)
        console.log('Токен сохранен в localStorage')
      }

      return responseData
    } catch (error) {
      console.error('Ошибка входа:', error)
      throw error
    }
  },

  async getUserData(): Promise<UserData> {
    console.log('Fetching user data...')
    const token = localStorage.getItem('access_token')
    
    if (!token) {
      throw new Error('Токен доступа не найден')
    }

    const response = await fetch(`${API_URL}/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('Response status:', response.status)
    if (!response.ok) {
      console.error('Failed to fetch user data:', response.status)
      if (response.status === 401) {
        // Если токен недействителен, удаляем его
        localStorage.removeItem('access_token')
        throw new Error('Сессия истекла. Пожалуйста, войдите снова.')
      }
      throw new Error('Не удалось получить данные пользователя')
    }

    return response.json()
  },

  async getCategories(): Promise<Category[]> {
    console.log('Fetching categories...')
    try {
      const response = await fetch(`${API_URL}/v1/categories/`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to fetch categories')
      }
      
      const data = await response.json()
      console.log('Categories received:', data)
      return data
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  },

  async getBooksByCategory(slug: string): Promise<CategoryBooksResponse> {
    console.log('Fetching books for category:', slug)
    const response = await fetch(`${API_URL}/v1/books/category/${slug}/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch books:', response.status)
      throw new Error('Failed to fetch books')
    }

    const data = await response.json()
    console.log('Books received:', data)
    return data
  },

  async getLatestBooks(limit: number = 4): Promise<Book[]> {
    console.log('Fetching latest books with limit:', limit)
    const url = `${API_URL}/v1/books/?skip=0&limit=${limit}`
    console.log('Request URL:', url)
    console.log('Request headers:', {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    })

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch latest books')
      }

      return data
    } catch (error) {
      console.error('Error fetching latest books:', error)
      throw error
    }
  },

  async getBookById(id: string): Promise<Book> {
    console.log('Fetching book with ID:', id)
    const url = `${API_URL}/v1/books/${id}`
    console.log('Request URL:', url)
    console.log('Request headers:', {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    })

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch book')
      }

      return data
    } catch (error) {
      console.error('Error fetching book:', error)
      throw error
    }
  },

  async getBookReviews(bookId: string): Promise<Review[]> {
    console.log('Fetching reviews for book:', bookId)
    const url = `${API_URL}/v1/reviews/book/${bookId}`
    console.log('Request URL:', url)
    console.log('Request headers:', {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    })

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch reviews')
      }

      return data
    } catch (error) {
      console.error('Error fetching reviews:', error)
      throw error
    }
  },

  async addToFavorites(bookId: number): Promise<Favorite> {
    console.log('Adding book to favorites:', bookId)
    const url = `${API_URL}/v1/favorites/${bookId}`
    console.log('Request URL:', url)
    console.log('Request headers:', {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    })

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to add book to favorites')
      }

      return data
    } catch (error) {
      console.error('Error adding book to favorites:', error)
      throw error
    }
  },

  async removeFromFavorites(bookId: number): Promise<void> {
    console.log('Removing book from favorites:', bookId)
    const url = `${API_URL}/v1/favorites/${bookId}`
    console.log('Request URL:', url)
    console.log('Request headers:', {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    })

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to remove book from favorites')
      }
    } catch (error) {
      console.error('Error removing book from favorites:', error)
      throw error
    }
  },

  async checkFavoriteStatus(bookId: number): Promise<boolean> {
    console.log('Checking favorite status for book:', bookId)
    const url = `${API_URL}/v1/favorites/check/${bookId}`
    console.log('Request URL:', url)
    console.log('Request headers:', {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    })

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to check favorite status')
      }

      return data.is_favorited
    } catch (error) {
      console.error('Error checking favorite status:', error)
      throw error
    }
  },

  async getUserFavorites(): Promise<Favorite[]> {
    const url = `${API_URL}/v1/favorites/`
    console.log('Fetching user favorites from:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch favorites')
    }

    return response.json()
  },

  async getReviews(skip: number = 0, limit: number = 10): Promise<Review[]> {
    console.log('Fetching reviews...')
    try {
      const response = await fetch(`${API_URL}/v1/reviews/?skip=${skip}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to fetch reviews')
      }

      const data = await response.json()
      console.log('Reviews received:', data)
      return data
    } catch (error) {
      console.error('Error fetching reviews:', error)
      throw error
    }
  },

  async getReviewById(reviewId: number): Promise<Review> {
    console.log('Fetching review by ID:', reviewId)
    try {
      const response = await fetch(`${API_URL}/v1/reviews/${reviewId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to fetch review')
      }

      const data = await response.json()
      console.log('Review received:', data)
      return data
    } catch (error) {
      console.error('Error fetching review:', error)
      throw error
    }
  },

  async getUserById(userId: number): Promise<UserInfo> {
    console.log('Fetching user info for ID:', userId)
    try {
      const response = await fetch(`${API_URL}/v1/auth/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to fetch user info')
      }

      const data = await response.json()
      console.log('User info received:', data)
      return data
    } catch (error) {
      console.error('Error fetching user info:', error)
      throw error
    }
  },

  async addComment(reviewId: number, content: string): Promise<Comment> {
    console.log('Adding comment to review:', reviewId)
    try {
      const response = await fetch(`${API_URL}/v1/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to add comment')
      }

      const data = await response.json()
      console.log('Comment added:', data)
      return data
    } catch (error) {
      console.error('Error adding comment:', error)
      throw error
    }
  },

  async updateComment(commentId: number, content: string): Promise<Comment> {
    console.log('Updating comment:', commentId)
    try {
      const response = await fetch(`${API_URL}/v1/reviews/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to update comment')
      }

      const data = await response.json()
      console.log('Comment updated:', data)
      return data
    } catch (error) {
      console.error('Error updating comment:', error)
      throw error
    }
  },

  async deleteComment(commentId: number): Promise<void> {
    console.log('Deleting comment:', commentId)
    try {
      const response = await fetch(`${API_URL}/v1/reviews/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw error
    }
  },

  async createReview(data: ReviewCreate): Promise<ReviewResponse> {
    const response = await fetch(`${API_URL}/v1/reviews/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create review');
    }

    return response.json();
  },

  async updateReview(reviewId: number, data: Omit<ReviewCreate, 'book_id'>): Promise<ReviewResponse> {
    const response = await fetch(`${API_URL}/v1/reviews/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update review');
    }

    return response.json();
  },

  async deleteReview(reviewId: number): Promise<void> {
    const response = await fetch(`${API_URL}/v1/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete review');
    }
  },

  async getUserReviews(userId: number): Promise<Review[]> {
    const response = await fetch(`${API_URL}/v1/reviews/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch user reviews')
    }

    return response.json()
  },

  async createBook(data: BookCreate): Promise<Book> {
    console.log('Creating new book:', data)
    try {
      const response = await fetch(`${API_URL}/v1/books/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to create book')
      }

      const newBook = await response.json()
      console.log('Book created:', newBook)
      return newBook
    } catch (error) {
      console.error('Error creating book:', error)
      throw error
    }
  },

  async deleteBook(bookId: number): Promise<void> {
    console.log('Deleting book:', bookId)
    try {
      const response = await fetch(`${API_URL}/v1/books/${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to delete book')
      }
    } catch (error) {
      console.error('Error deleting book:', error)
      throw error
    }
  },

  async createCategory(data: CategoryCreate): Promise<Category> {
    try {
      const response = await fetch(`${API_URL}/v1/categories/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Ошибка при создании категории")
      }

      return response.json()
    } catch (error) {
      console.error("Ошибка при создании категории:", error)
      throw error
    }
  },

  async logout(): Promise<void> {
    try {
      // Просто удаляем токен из localStorage
      localStorage.removeItem("access_token")
    } catch (error) {
      console.error("Ошибка при выходе:", error)
      throw error
    }
  }
} 