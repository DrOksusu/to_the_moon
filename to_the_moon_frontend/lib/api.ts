// API client utility
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3007/api'

interface RequestOptions extends RequestInit {
  token?: string
}

// Helper function to get token from localStorage (client-side only)
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('vocalstudio_token')
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  // Use provided token or get from localStorage
  const authToken = token || getToken()
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const url = `${API_URL}${endpoint}`
  console.log('API Request:', url)

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    let error: any
    let errorText = ''

    try {
      // Try to parse as JSON
      errorText = await response.text()
      console.log('Raw error text from API:', errorText)
      error = errorText ? JSON.parse(errorText) : {}
      console.log('Parsed error object:', error)
    } catch (e) {
      // If JSON parsing fails, use the text as error
      console.error('Failed to parse error as JSON:', e)
      error = { error: errorText || `HTTP ${response.status}: ${response.statusText}` }
    }

    // Handle different error response formats
    const errorMessage =
      error.error?.message || // { error: { message: '...' } }
      error.error ||          // { error: '...' }
      error.message ||        // { message: '...' }
      errorText ||           // Raw text response
      `Request failed with status ${response.status}`

    console.log('Final error message:', errorMessage)

    // Handle token expiration - redirect to login without throwing error
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vocalstudio_user')
        localStorage.removeItem('vocalstudio_token')
        // Redirect to login page with session expired message
        window.location.href = '/login?expired=true'
        // Return a never-resolving promise to prevent further execution
        return new Promise(() => {}) as T
      }
    }

    // Don't log 404 errors as they are often expected (e.g., no feedback exists yet)
    if (response.status !== 404) {
      console.error('API Error:', `${response.status} ${response.statusText}`, errorMessage)
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export async function apiRequestFormData<T>(
  endpoint: string,
  formData: FormData,
  token?: string
): Promise<T> {
  const headers: HeadersInit = {}

  // Use provided token or get from localStorage
  const authToken = token || getToken()
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    let error: any
    let errorText = ''

    try {
      // Try to parse as JSON
      errorText = await response.text()
      console.log('Raw error text from API:', errorText)
      error = errorText ? JSON.parse(errorText) : {}
      console.log('Parsed error object:', error)
    } catch (e) {
      // If JSON parsing fails, use the text as error
      console.error('Failed to parse error as JSON:', e)
      error = { error: errorText || `HTTP ${response.status}: ${response.statusText}` }
    }

    // Handle different error response formats
    const errorMessage =
      error.error?.message || // { error: { message: '...' } }
      error.error ||          // { error: '...' }
      error.message ||        // { message: '...' }
      errorText ||           // Raw text response
      `Request failed with status ${response.status}`

    console.log('Final error message:', errorMessage)

    // Handle token expiration - redirect to login without throwing error
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vocalstudio_user')
        localStorage.removeItem('vocalstudio_token')
        // Redirect to login page with session expired message
        window.location.href = '/login?expired=true'
        // Return a never-resolving promise to prevent further execution
        return new Promise(() => {}) as T
      }
    }

    // Don't log 404 errors as they are often expected (e.g., no feedback exists yet)
    if (response.status !== 404) {
      console.error('API Error:', `${response.status} ${response.statusText}`, errorMessage)
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

// Convenience methods for common HTTP operations
export const api = {
  get: <T>(endpoint: string, token?: string) =>
    apiRequest<T>(endpoint, { method: 'GET', token }),

  post: <T>(endpoint: string, data: unknown, token?: string) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  put: <T>(endpoint: string, data: unknown, token?: string) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  delete: <T>(endpoint: string, token?: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE', token }),

  patch: <T>(endpoint: string, data: unknown, token?: string) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),
}

export { API_URL }
