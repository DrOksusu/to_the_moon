'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<'teacher' | 'student'>('teacher')
  const [rememberMe, setRememberMe] = useState(false)
  const [teacherIdentifier, setTeacherIdentifier] = useState('')
  const [teacherPassword, setTeacherPassword] = useState('')
  const [studentIdentifier, setStudentIdentifier] = useState('')
  const [studentPassword, setStudentPassword] = useState('')
  const [showTeacherPassword, setShowTeacherPassword] = useState(false)
  const [showStudentPassword, setShowStudentPassword] = useState(false)

  // 세션 만료 체크
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('expired') === 'true') {
      toast({
        title: '세션이 만료되었습니다',
        description: '보안을 위해 다시 로그인해주세요.',
        variant: 'destructive',
        duration: 5000,
      })
      // URL에서 expired 파라미터 제거
      router.replace('/login')
    }
  }, [toast, router])

  // 저장된 로그인 정보 불러오기
  useEffect(() => {
    const savedTeacherIdentifier = localStorage.getItem('remembered_teacher_identifier')
    const savedTeacherPassword = localStorage.getItem('remembered_teacher_password')
    const savedStudentIdentifier = localStorage.getItem('remembered_student_identifier')
    const savedStudentPassword = localStorage.getItem('remembered_student_password')
    const savedRememberMe = localStorage.getItem('remember_me') === 'true'

    if (savedRememberMe) {
      setRememberMe(true)
      if (savedTeacherIdentifier) setTeacherIdentifier(savedTeacherIdentifier)
      if (savedTeacherPassword) setTeacherPassword(savedTeacherPassword)
      if (savedStudentIdentifier) setStudentIdentifier(savedStudentIdentifier)
      if (savedStudentPassword) setStudentPassword(savedStudentPassword)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const identifier = formData.get('identifier') as string
    const password = formData.get('password') as string

    try {
      await login(identifier, password, role)

      // 로그인 정보 저장 (Remember Me 체크 시)
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true')
        if (role === 'teacher') {
          localStorage.setItem('remembered_teacher_identifier', identifier)
          localStorage.setItem('remembered_teacher_password', password)
        } else {
          localStorage.setItem('remembered_student_identifier', identifier)
          localStorage.setItem('remembered_student_password', password)
        }
      } else {
        // Remember Me 체크 해제 시 저장된 정보 삭제
        localStorage.removeItem('remember_me')
        if (role === 'teacher') {
          localStorage.removeItem('remembered_teacher_identifier')
          localStorage.removeItem('remembered_teacher_password')
        } else {
          localStorage.removeItem('remembered_student_identifier')
          localStorage.removeItem('remembered_student_password')
        }
      }

      toast({
        title: '로그인 성공',
        description: 'To The MOON Vocal Studio에 오신 것을 환영합니다.',
        duration: 1000,
      })

      // 관리자는 /admin/dashboard로, 일반 사용자는 역할에 따라 리다이렉트
      const savedUser = localStorage.getItem('vocalstudio_user')
      const user = savedUser ? JSON.parse(savedUser) : null

      if (user?.is_admin) {
        router.push('/admin/dashboard')
      } else {
        router.push(role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
      }
    } catch (error: any) {
      // 에러 메시지에 따라 다른 안내 제공
      const errorMessage = error?.message || '알 수 없는 오류가 발생했습니다'

      let title = '로그인 실패'
      let description = '이메일/전화번호 또는 비밀번호를 확인해주세요.'

      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('자격 증명')) {
        title = '로그인 정보가 일치하지 않습니다'
        description = role === 'teacher'
          ? '이메일/전화번호 또는 비밀번호가 일치하지 않습니다. 회원가입이 되어있지 않다면 아래 "회원가입" 버튼을 클릭해주세요.'
          : '전화번호 또는 비밀번호가 일치하지 않습니다. 선생님께 등록을 요청해주세요.'
      } else if (errorMessage.includes('User not found') || errorMessage.includes('찾을 수 없습니다')) {
        title = '계정을 찾을 수 없습니다'
        description = role === 'teacher'
          ? '등록되지 않은 계정입니다. 회원가입을 먼저 진행해주세요.'
          : '등록되지 않은 학생입니다. 선생님께 먼저 등록을 요청해주세요.'
      }

      toast({
        title,
        description,
        variant: 'destructive',
        duration: 5000, // 5초간 표시
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">To The MOON Vocal Studio</CardTitle>
          <CardDescription>계정에 로그인하여 시작하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={role} onValueChange={(v) => setRole(v as 'teacher' | 'student')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="teacher">선생님</TabsTrigger>
              <TabsTrigger value="student">학생</TabsTrigger>
            </TabsList>
            <TabsContent value="teacher">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">이메일 또는 전화번호</Label>
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    placeholder="이메일 또는 전화번호"
                    value={teacherIdentifier}
                    onChange={(e) => setTeacherIdentifier(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showTeacherPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showTeacherPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                    >
                      {showTeacherPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-teacher"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label
                    htmlFor="remember-teacher"
                    className="text-sm font-normal cursor-pointer"
                  >
                    로그인 정보 기억하기
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? '로그인 중...' : '선생님으로 로그인'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="student">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier-student">전화번호</Label>
                  <Input
                    id="identifier-student"
                    name="identifier"
                    type="tel"
                    placeholder="010-1234-5678"
                    value={studentIdentifier}
                    onChange={(e) => setStudentIdentifier(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-student">비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="password-student"
                      name="password"
                      type={showStudentPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showStudentPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                    >
                      {showStudentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-student"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label
                    htmlFor="remember-student"
                    className="text-sm font-normal cursor-pointer"
                  >
                    로그인 정보 기억하기
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? '로그인 중...' : '학생으로 로그인'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {role === 'teacher' ? '아직 계정이 없으신가요?' : '선생님께 등록을 요청하셨나요?'}
              </p>
              {role === 'teacher' ? (
                <Link href="/signup">
                  <Button variant="outline" className="w-full">
                    회원가입하기
                  </Button>
                </Link>
              ) : (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                  💡 학생은 선생님이 먼저 등록해야 로그인할 수 있습니다
                </p>
              )}
            </div>
            <div className="text-center text-sm text-muted-foreground pt-2 border-t">
              <Link href="/" className="hover:text-primary transition-colors">
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
