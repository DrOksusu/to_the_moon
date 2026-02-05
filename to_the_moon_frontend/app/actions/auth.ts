'use server'

import { redirect } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3007/api'

export async function signUp(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const role = formData.get('role') as string
  const password = formData.get('password') as string

  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, role, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create account')
    }

    // Redirect to login page after successful signup
    redirect('/login')
  } catch (error) {
    console.error('Signup error:', error)
    throw error
  }
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to sign in')
    }

    const data = await response.json()

    // Store user and token (this is server-side, so we can't use localStorage here)
    // The client-side auth-context will handle this

    // Redirect to appropriate dashboard based on role
    if (role === 'teacher') {
      redirect('/teacher/dashboard')
    } else {
      redirect('/student/dashboard')
    }
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}
