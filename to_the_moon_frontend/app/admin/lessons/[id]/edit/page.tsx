'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AdminNav } from '@/components/admin/admin-nav'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-context'

interface Teacher {
  id: string
  name: string
  email: string
}

interface Student {
  id: string
  name: string
  email: string
}

interface Lesson {
  id: string
  teacher_id: string
  student_id: string
  teacher: {
    id: string
    name: string
    email: string
  }
  student: {
    id: string
    name: string
    email: string
  }
  title?: string
  scheduled_at: string
  duration: number
  status: string
  location?: string
  notes?: string
}

export default function AdminEditLessonPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [duration, setDuration] = useState<string>('60')
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM')
  const [hour, setHour] = useState<string>('2')
  const [minute, setMinute] = useState<string>('00')
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    notes: '',
  })

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.is_admin && params.id) {
      fetchData()
    }
  }, [user, params.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const lessonId = params.id as string
      const [lessonData, teachersData, studentsData] = await Promise.all([
        api.get<Lesson>(`/admin/lessons/${lessonId}`),
        api.get<Teacher[]>('/admin/teachers'),
        api.get<Student[]>('/admin/students'),
      ])

      setLesson(lessonData)
      setTeachers(teachersData)
      setStudents(studentsData)

      // Parse the scheduled_at date
      const scheduledDate = new Date(lessonData.scheduled_at)
      const date = scheduledDate.toISOString().split('T')[0]

      const hours24 = scheduledDate.getHours()
      const mins = scheduledDate.getMinutes()

      let hours12 = hours24 % 12
      if (hours12 === 0) hours12 = 12
      const periodValue = hours24 >= 12 ? 'PM' : 'AM'

      setSelectedTeacherId(lessonData.teacher?.id || lessonData.teacher_id)
      setSelectedStudentId(lessonData.student?.id || lessonData.student_id)
      setDuration(lessonData.duration.toString())
      setPeriod(periodValue)
      setHour(hours12.toString())
      setMinute(mins.toString().padStart(2, '0'))
      setFormData({
        title: lessonData.title || '',
        date,
        location: lessonData.location || '',
        notes: lessonData.notes || '',
      })
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast({
        title: '오류',
        description: '레슨 정보를 불러오지 못했습니다',
        variant: 'destructive',
      })
      router.push('/admin/lessons')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    if (!selectedTeacherId) {
      toast({
        title: '오류',
        description: '선생님을 선택해주세요',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    if (!selectedStudentId) {
      toast({
        title: '오류',
        description: '학생을 선택해주세요',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    if (!formData.date) {
      toast({
        title: '오류',
        description: '날짜와 시간을 입력해주세요',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    let hour24 = parseInt(hour)
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0
    }
    const timeStr = `${hour24.toString().padStart(2, '0')}:${minute}`

    const scheduled_at = `${formData.date}T${timeStr}:00+09:00`

    const updateData = {
      teacher_id: selectedTeacherId,
      student_id: selectedStudentId,
      title: formData.title,
      scheduled_at: scheduled_at,
      duration: parseInt(duration),
      location: formData.location,
      notes: formData.notes,
    }

    try {
      await api.put(`/admin/lessons/${params.id}`, updateData)
      toast({
        title: '성공',
        description: '레슨 일정이 수정되었습니다',
      })
      setTimeout(() => {
        router.push('/admin/lessons?tab=upcoming')
      }, 500)
    } catch (error) {
      console.error('Failed to update lesson:', error)
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '레슨 일정 수정에 실패했습니다',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNav />
        <div className="container mx-auto p-6">
          <div className="text-center">로딩중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />

      <main className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>레슨 일정 수정 (관리자)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teacher_id">선생님</Label>
                <Select
                  name="teacher_id"
                  required
                  value={selectedTeacherId}
                  onValueChange={setSelectedTeacherId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선생님을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student_id">학생</Label>
                <Select
                  name="student_id"
                  required
                  value={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="학생을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">레슨 제목</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="보컬 테크닉 연습"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">날짜</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>시간</Label>
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
                  <Label htmlFor="duration">레슨 시간 (분)</Label>
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
                      <SelectItem value="30">30분</SelectItem>
                      <SelectItem value="45">45분</SelectItem>
                      <SelectItem value="60">60분</SelectItem>
                      <SelectItem value="90">90분</SelectItem>
                      <SelectItem value="120">120분</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">장소</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="스튜디오 A"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">메모</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="레슨 계획, 목표, 준비사항..."
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? '수정 중...' : '수정 완료'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
