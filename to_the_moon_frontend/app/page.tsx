'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { Globe } from 'lucide-react'

const translations = {
  ko: {
    title: 'To The MOON Vocal Studio',
    description: '보컬 선생님을 위한 종합 플랫폼으로 학생 관리, 레슨 예약, 맞춤형 피드백을 제공합니다',
    signIn: '로그인',
    signUp: '회원가입',
  },
  en: {
    title: 'To The MOON Vocal Studio',
    description: 'A comprehensive platform for vocal teachers to manage students, schedule lessons, and provide personalized feedback',
    signIn: 'Sign In',
    signUp: 'Sign Up',
  },
}

export default function HomePage() {
  const [language, setLanguage] = useState<'ko' | 'en'>('ko')

  useEffect(() => {
    const savedLanguage = localStorage.getItem('vocalstudio_language') as 'ko' | 'en' | null
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  const toggleLanguage = () => {
    const newLanguage = language === 'ko' ? 'en' : 'ko'
    setLanguage(newLanguage)
    localStorage.setItem('vocalstudio_language', newLanguage)
  }

  const t = translations[language]

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="flex items-center gap-2"
        >
          <Globe className="h-4 w-4" />
          {language === 'ko' ? '한국어' : 'English'}
        </Button>
      </div>
      <div className="text-center space-y-6 max-w-2xl">
        <div className="flex justify-center">
          <Image
            src="/to_the_moon_logo3.jpg"
            alt="To The MOON Vocal Studio Logo"
            width={200}
            height={200}
            className="shadow-lg"
          />
        </div>
        <h1 className="text-5xl font-bold text-balance text-gray-900">
          {t.title}
        </h1>
        <p className="text-xl text-pretty text-gray-600">
          {t.description}
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">{t.signIn}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/signup">{t.signUp}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
