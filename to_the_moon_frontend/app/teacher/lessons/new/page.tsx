'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TeacherNav } from '@/components/teacher/teacher-nav'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Student {
  id: string
  user: {
    id: string
    name: string
    email: string
    phone?: string
  }
  voice_type?: string
  level?: string
  start_date?: string
  goals?: string
}

const translations = {
  ko: {
    title: '새 레슨 등록',
    student: '학생',
    selectStudent: '학생을 선택하세요',
    lessonTitle: '레슨 제목',
    lessonTitlePlaceholder: '보컬 테크닉 연습',
    date: '날짜',
    time: '시간',
    duration: '레슨 시간 (분)',
    location: '장소',
    locationPlaceholder: '스튜디오 A',
    notes: '메모',
    notesPlaceholder: '레슨 계획, 목표, 준비사항...',
    scheduling: '등록 중...',
    scheduleLesson: '레슨 등록',
    cancel: '취소',
    success: '성공',
    successDesc: '레슨이 성공적으로 등록되었습니다',
    error: '오류',
    loadError: '학생 목록을 불러오지 못했습니다',
    scheduleError: '레슨 등록에 실패했습니다',
  },
  en: {
    title: 'Schedule New Lesson',
    student: 'Student',
    selectStudent: 'Select a student',
    lessonTitle: 'Lesson Title',
    lessonTitlePlaceholder: 'Vocal Technique Practice',
    date: 'Date',
    time: 'Time',
    duration: 'Duration (minutes)',
    location: 'Location',
    locationPlaceholder: 'Studio A',
    notes: 'Notes',
    notesPlaceholder: 'Lesson plan, goals, or preparation notes...',
    scheduling: 'Scheduling...',
    scheduleLesson: 'Schedule Lesson',
    cancel: 'Cancel',
    success: 'Success',
    successDesc: 'Lesson scheduled successfully',
    error: 'Error',
    loadError: 'Failed to load students',
    scheduleError: 'Failed to schedule lesson',
  },
}

export default function NewLessonPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [duration, setDuration] = useState<string>('60')
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM')
  const [hour, setHour] = useState<string>('2')
  const [minute, setMinute] = useState<string>('00')
  const [language, setLanguage] = useState<'ko' | 'en'>('ko')

  useEffect(() => {
    const savedLanguage = localStorage.getItem('vocalstudio_language') as 'ko' | 'en' | null
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  const t = translations[language]

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await api.get<Student[]>('/teacher/students')
        console.log('Students data received:', data)
        setStudents(data)
      } catch (error) {
        console.error('Failed to fetch students:', error)
        toast({
          title: t.error,
          description: t.loadError,
          variant: 'destructive',
        })
      }
    }
    fetchStudents()
  }, [toast, t])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    // Validate required fields
    if (!selectedStudentId) {
      toast({
        title: t.error,
        description: '학생을 선택해주세요',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    const date = formData.get('date') as string

    if (!date) {
      toast({
        title: t.error,
        description: '날짜와 시간을 입력해주세요',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    // 오전/오후, 시, 분을 24시간 형식으로 변환
    let hour24 = parseInt(hour)
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0
    }
    const timeStr = `${hour24.toString().padStart(2, '0')}:${minute}`

    // 한국 시간대(KST, +09:00)를 명시적으로 포함하여 전송
    const scheduled_at = `${date}T${timeStr}:00+09:00`

    const lessonData = {
      student_id: selectedStudentId,
      title: formData.get('title') as string || '',
      scheduled_at: scheduled_at,
      duration: parseInt(duration),
      location: formData.get('location') as string || '',
      notes: formData.get('notes') as string || '',
    }

    console.log('Sending lesson data:', lessonData)
    console.log('Selected student ID:', selectedStudentId)
    console.log('Date:', date)
    console.log('Time:', timeStr)

    try {
      await api.post('/lessons', lessonData)
      toast({
        title: t.success,
        description: t.successDesc,
      })
      router.push('/teacher/lessons')
    } catch (error) {
      console.error('Failed to create lesson:', error)
      toast({
        title: t.error,
        description: error instanceof Error ? error.message : t.scheduleError,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav />

      <main className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student_id">{t.student}</Label>
                <Select
                  name="student_id"
                  required
                  value={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectStudent} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.user.id} value={student.user.id}>
                        {student.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">{t.lessonTitle}</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder={t.lessonTitlePlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">{t.date}</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t.time}</Label>
                <div className="flex gap-2">
                  <div className="w-24 min-w-[6rem]">
                    <Select value={period} onValueChange={(v) => setPeriod(v as 'AM' | 'PM')}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={5}>
                        <SelectItem value="AM">오전</SelectItem>
                        <SelectItem value="PM">오후</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[5rem]">
                    <Select value={hour} onValueChange={setHour}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={5} className="max-h-[200px]">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                          <SelectItem key={h} value={h.toString()}>
                            {h}시
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[5rem]">
                    <Select value={minute} onValueChange={setMinute}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={5} className="max-h-[200px]">
                        {['00', '10', '20', '30', '40', '50'].map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}분
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">{t.duration}</Label>
                  <Select
                    name="duration"
                    required
                    value={duration}
                    onValueChange={setDuration}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">{language === 'ko' ? '30분' : '30 minutes'}</SelectItem>
                      <SelectItem value="45">{language === 'ko' ? '45분' : '45 minutes'}</SelectItem>
                      <SelectItem value="60">{language === 'ko' ? '60분' : '60 minutes'}</SelectItem>
                      <SelectItem value="90">{language === 'ko' ? '90분' : '90 minutes'}</SelectItem>
                      <SelectItem value="120">{language === 'ko' ? '120분' : '120 minutes'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">{t.location}</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder={t.locationPlaceholder}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t.notes}</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder={t.notesPlaceholder}
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? t.scheduling : t.scheduleLesson}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  {t.cancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
