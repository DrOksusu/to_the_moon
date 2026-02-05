'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const translations = {
  ko: {
    title: 'To The MOON Vocal Studio',
    description: '학생 계정을 만드세요',
    fullName: '이름',
    fullNamePlaceholder: '홍길동',
    email: '이메일',
    emailPlaceholder: 'your@email.com',
    phone: '전화번호',
    phonePlaceholder: '010-1234-5678',
    studentNote: '가입 후 선생님이 배정해드립니다',
    password: '비밀번호',
    passwordPlaceholder: '••••••••',
    createAccount: '계정 만들기',
    creating: '계정 만드는 중...',
    alreadyHaveAccount: '이미 계정이 있으신가요?',
    signIn: '로그인',
    success: '성공',
    accountCreated: '계정이 생성되었습니다',
    error: '오류',
    failedToCreate: '계정 생성에 실패했습니다',
  },
  en: {
    title: 'To The MOON Vocal Studio',
    description: 'Create your student account',
    fullName: 'Full Name',
    fullNamePlaceholder: 'John Doe',
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    phone: 'Phone',
    phonePlaceholder: '010-1234-5678',
    studentNote: 'A teacher will be assigned after signup',
    password: 'Password',
    passwordPlaceholder: '••••••••',
    createAccount: 'Create Account',
    creating: 'Creating account...',
    alreadyHaveAccount: 'Already have an account?',
    signIn: 'Sign in',
    success: 'Success',
    accountCreated: 'Account created successfully',
    error: 'Error',
    failedToCreate: 'Failed to create account',
  },
}

export default function SignUpPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [language, setLanguage] = useState<'ko' | 'en'>('ko')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const savedLanguage = localStorage.getItem('vocalstudio_language') as 'ko' | 'en' | null
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string || undefined

    // 특정 이메일은 선생님으로, 나머지는 학생으로 가입
    const role = email === 'wjddms2767@naver.com' ? 'teacher' : 'student'

    const signupData = {
      name: formData.get('name') as string,
      email,
      phone: formData.get('phone') as string,
      role,
      password: formData.get('password') as string,
    }

    console.log('Sending signup data:', signupData)

    try {
      await api.post('/auth/signup', signupData)
      toast({
        title: t.success,
        description: t.accountCreated,
      })
      router.push('/login')
    } catch (error: any) {
      console.error('Signup error caught:', error)
      console.error('Error message:', error.message)
      console.error('Error object:', JSON.stringify(error, null, 2))

      let errorMessage = t.failedToCreate
      let errorTitle = t.error

      // 에러 메시지에 따라 한국어로 변환
      if (error.message?.includes('Phone number already exists')) {
        errorTitle = language === 'ko' ? '이미 가입된 전화번호' : 'Phone Already Registered'
        errorMessage = language === 'ko'
          ? '이 전화번호는 이미 가입되어 있습니다.\n\n로그인 페이지에서 해당 번호로 로그인해주세요.'
          : 'This phone number is already registered.\n\nPlease log in using this number.'
      } else if (error.message?.includes('Email already exists')) {
        errorTitle = language === 'ko' ? '이미 사용 중인 이메일' : 'Email Already Used'
        errorMessage = language === 'ko'
          ? '이 이메일은 이미 사용 중입니다.\n\n다른 이메일을 사용하거나 로그인해주세요.'
          : 'This email is already in use.\n\nPlease use a different email or log in.'
      } else if (error.message?.includes('required')) {
        errorMessage = language === 'ko'
          ? '이름, 전화번호, 비밀번호는 필수 입력 항목입니다.'
          : 'Name, phone number, and password are required.'
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const t = translations[language]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t.title}</CardTitle>
          <CardDescription className="text-center">
            {t.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="name">{t.fullName} <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={t.fullNamePlaceholder}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t.phone} <span className="text-red-500">*</span></Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder={t.phonePlaceholder}
                autoComplete="off"
                required
              />
              <p className="text-sm text-muted-foreground">
                {language === 'ko' ? '로그인 시 전화번호를 사용합니다' : 'Use phone number for login'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.email} (선택)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t.emailPlaceholder}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.password} <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t.passwordPlaceholder}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t.creating : t.createAccount}
            </Button>
          </form>
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {t.alreadyHaveAccount}
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  {t.signIn}
                </Button>
              </Link>
            </div>
            <div className="text-center text-sm text-muted-foreground pt-2 border-t">
              <Link href="/" className="hover:text-primary transition-colors">
                {language === 'ko' ? '홈으로 돌아가기' : 'Back to Home'}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
