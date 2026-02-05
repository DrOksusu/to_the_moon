'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { User } from './mock-data'
import { apiRequest } from './api'

interface AuthContextType {
  user: User | null
  login: (identifier: string, password: string, role: 'teacher' | 'student') => Promise<void>
  logout: () => void
  isLoading: boolean
}

interface LoginResponse {
  user: User
  token: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const verifyAndRestoreSession = async () => {
      const savedToken = localStorage.getItem('vocalstudio_token')

      if (!savedToken) {
        setIsLoading(false)
        return
      }

      try {
        // Verify token with backend and get fresh user data
        const response = await apiRequest<User>('/auth/me', {
          token: savedToken,
        })

        // Update user state and localStorage with fresh data
        setUser(response)
        localStorage.setItem('vocalstudio_user', JSON.stringify(response))
      } catch (error) {
        // Token is invalid or expired, clean up
        console.error('Session verification failed:', error)
        localStorage.removeItem('vocalstudio_user')
        localStorage.removeItem('vocalstudio_token')
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    verifyAndRestoreSession()
  }, [])

  const login = async (identifier: string, password: string, role: 'teacher' | 'student') => {
    try {
      const response = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password, role }),
      })

      setUser(response.user)
      localStorage.setItem('vocalstudio_user', JSON.stringify(response.user))
      localStorage.setItem('vocalstudio_token', response.token)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    const token = localStorage.getItem('vocalstudio_token')

    try {
      if (token) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          token,
        })
      }
    } catch (error) {
      // Ignore logout errors (e.g., expired token)
      // The finally block will clean up local storage regardless
    } finally {
      setUser(null)
      localStorage.removeItem('vocalstudio_user')
      localStorage.removeItem('vocalstudio_token')
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
