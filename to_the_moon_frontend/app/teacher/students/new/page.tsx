'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { TeacherNav } from '@/components/teacher/teacher-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

const translations = {
  ko: {
    title: '새 학생 등록',
    description: '학생의 이름과 전화번호를 입력하세요. 학생이 이 전화번호로 회원가입하면 자동으로 연결됩니다.',
    studentName: '학생 이름',
    studentNamePlaceholder: '홍길동',
    phone: '전화번호',
    phonePlaceholder: '010-1234-5678',
    startDate: '시작 날짜',
    voiceType: '레슨분야',
    selectVoiceType: '레슨분야를 선택하세요',
    vocalLesson: '보컬레슨',
    danceLesson: '댄스레슨',
    level: '레벨',
    selectLevel: '레벨을 선택하세요',
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
    professional: '전문가',
    goals: '목표',
    goalsPlaceholder: '학생의 학습 목표를 입력하세요...',
    addStudent: '학생 등록',
    adding: '등록 중...',
    cancel: '취소',
    success: '성공',
    studentAdded: '학생이 사전등록되었습니다. 학생이 이 전화번호로 회원가입하면 자동으로 연결됩니다.',
    error: '오류',
    addFailed: '학생 등록에 실패했습니다.',
  },
  en: {
    title: 'Pre-register New Student',
    description: 'Enter student name and phone number. When the student signs up with this phone number, they will be automatically connected.',
    studentName: 'Student Name',
    studentNamePlaceholder: 'John Doe',
    phone: 'Phone',
    phonePlaceholder: '010-1234-5678',
    startDate: 'Start Date',
    voiceType: 'Voice Type',
    selectVoiceType: 'Select voice type',
    vocalLesson: 'Vocal Lesson',
    danceLesson: 'Dance Lesson',
    level: 'Level',
    selectLevel: 'Select level',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    professional: 'Professional',
    goals: 'Goals',
    goalsPlaceholder: "Student's learning goals...",
    addStudent: 'Register Student',
    adding: 'Registering...',
    cancel: 'Cancel',
    success: 'Success',
    studentAdded: 'Student pre-registered. They will be automatically connected when they sign up with this phone number.',
    error: 'Error',
    addFailed: 'Failed to register student.',
  },
}

export default function NewStudentPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [language, setLanguage] = useState<'ko' | 'en'>('ko')
  const [submitting, setSubmitting] = useState(false)
  const [voiceType, setVoiceType] = useState('')
  const [level, setLevel] = useState('')

  useEffect(() => {
    const savedLanguage = localStorage.getItem('vocalstudio_language') as 'ko' | 'en' | null
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'teacher')) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)

    const formData = new FormData(e.currentTarget)

    const studentData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      voice_type: voiceType || undefined,
      level: level || undefined,
      start_date: formData.get('start_date') as string || undefined,
      goals: formData.get('goals') as string || undefined,
    }

    const t = translations[language]

    try {
      await api.post('/teacher/students', studentData)
      toast({
        title: t.success,
        description: t.studentAdded,
      })
      router.push('/teacher/students')
    } catch (error: any) {
      let errorMessage = t.addFailed
      let errorTitle = t.error

      // 백엔드에서 반환된 에러 메시지 확인
      const backendError = error.message || ''

      if (backendError.includes('already registered') || backendError.includes('already exists')) {
        errorTitle = language === 'ko' ? '이미 가입된 전화번호' : 'Phone Already Registered'
        errorMessage = language === 'ko'
          ? '이 전화번호는 이미 회원가입이 완료되었습니다.\n\n📱 해당 학생이 이미 가입했다면:\n"미배정 학생" 메뉴에서 찾아서 배정하시거나, 학생 관리 페이지에서 확인해주세요.\n\n✏️ 새로운 학생을 등록하시려면:\n다른 전화번호를 사용해주세요.'
          : 'This phone number is already registered.\n\nIf the student has already signed up:\nFind them in "Unassigned Students" or check the student management page.\n\nTo register a new student:\nPlease use a different phone number.'
      } else if (backendError.includes('pre-registered')) {
        errorTitle = language === 'ko' ? '이미 사전등록됨' : 'Already Pre-registered'
        errorMessage = language === 'ko'
          ? '이 전화번호는 이미 사전등록되어 있습니다.\n학생이 이 번호로 회원가입하면 자동으로 연결됩니다.'
          : 'This phone number is already pre-registered.\nWhen the student signs up with this number, they will be automatically connected.'
      } else if (backendError.includes('required')) {
        errorMessage = language === 'ko'
          ? '필수 입력 항목을 확인해주세요.'
          : 'Please check the required fields.'
      } else if (backendError) {
        errorMessage = backendError
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
        duration: 6000, // 6초 동안 표시 (더 긴 메시지이므로)
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading || !user) {
    return <div>로딩중...</div>
  }

  const t = translations[language]

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav />

      <main className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.studentName} *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder={t.studentNamePlaceholder}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t.phone} *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder={t.phonePlaceholder}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="voice_type">{t.voiceType}</Label>
                  <Select value={voiceType} onValueChange={setVoiceType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectVoiceType} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vocal">{t.vocalLesson}</SelectItem>
                      <SelectItem value="dance">{t.danceLesson}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">{t.level}</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectLevel} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">{t.beginner}</SelectItem>
                      <SelectItem value="intermediate">{t.intermediate}</SelectItem>
                      <SelectItem value="advanced">{t.advanced}</SelectItem>
                      <SelectItem value="professional">{t.professional}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">{t.startDate}</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">{t.goals}</Label>
                <Textarea
                  id="goals"
                  name="goals"
                  placeholder={t.goalsPlaceholder}
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? t.adding : t.addStudent}
                </Button>
                <Button type="button" variant="outline" className="flex-1" asChild>
                  <Link href="/teacher/students">{t.cancel}</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
