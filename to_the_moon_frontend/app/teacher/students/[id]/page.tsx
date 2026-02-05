'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TeacherNav } from '@/components/teacher/teacher-nav'
import { Calendar, Phone, Mail, Music, TrendingUp, Clock, MessageSquare, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface StudentProfile {
  id: string
  user: {
    id: string
    name: string
    email: string
    phone?: string
  }
  voice_type: string
  level: string
  start_date: string
  goals?: string
  total_lessons: number
  completed_lessons: number
  upcoming_lessons: number
}

interface Lesson {
  id: string
  title?: string
  scheduled_at: string
  duration: number
  status: string
}

interface Feedback {
  id: string
  lesson_id: string
  content: string
  rating?: number
  created_at: string
}

interface StudentStats {
  total_lessons: number
  completed_lessons: number
}

export default function StudentProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [stats, setStats] = useState<StudentStats>({ total_lessons: 0, completed_lessons: 0 })
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([])
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'teacher')) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && user.role === 'teacher' && params.id) {
      fetchStudentData()
    }
  }, [user, params.id])

  const fetchStudentData = async () => {
    try {
      setLoading(true)
      const studentId = params.id as string

      // Fetch student profile (includes stats)
      const profileData = await api.get<StudentProfile>(`/teacher/students/${studentId}`)
      setProfile(profileData)

      // Set stats from profile data
      setStats({
        total_lessons: profileData.total_lessons || 0,
        completed_lessons: profileData.completed_lessons || 0,
      })

      // Fetch upcoming lessons for this student
      const lessonsData = await api.get<Lesson[]>(`/lessons`)
      const studentLessons = lessonsData.filter((l: any) =>
        l.student.id === profileData.user.id &&
        l.status === 'scheduled' &&
        new Date(l.scheduled_at) >= new Date()
      ).slice(0, 3)
      setUpcomingLessons(studentLessons)

      // Fetch recent feedback for this student
      const feedbackData = await api.get<Feedback[]>(`/feedback`)
      const studentFeedback = feedbackData.filter((f: any) =>
        f.student_id === profileData.user.id
      ).slice(0, 3)
      setRecentFeedback(studentFeedback)
    } catch (error) {
      console.error('Failed to fetch student data:', error)
      router.push('/teacher/students')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!profile) return

    if (!confirm(`정말 ${profile.user.name} 학생을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      setDeleting(true)
      await api.delete(`/teacher/students/${profile.id}`)
      toast({
        title: '성공',
        description: '학생이 삭제되었습니다',
      })
      router.push('/teacher/students')
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '학생 삭제에 실패했습니다',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading || !user) {
    return <div>로딩중...</div>
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <TeacherNav />
        <div className="container mx-auto p-6">
          <div className="text-center">학생 정보를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav />

      <main className="container mx-auto p-6 max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{profile.user.name}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {profile.user.email}
                  </div>
                  {profile.user.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {profile.user.phone}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href={`/teacher/lessons/new?student=${profile.id}`}>
                    수업 등록
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteStudent}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? '삭제 중...' : '학생 삭제'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3">
                <Music className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">성부</div>
                  <div className="font-medium capitalize">{profile.voice_type || '-'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">레벨</div>
                  <div className="font-medium capitalize">{profile.level || '-'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">시작일</div>
                  <div className="font-medium">
                    {new Date(profile.start_date).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">완료한 수업</div>
                  <div className="font-medium">
                    {stats.completed_lessons} / {stats.total_lessons}
                  </div>
                </div>
              </div>
            </div>

            {profile.goals && (
              <div>
                <h3 className="font-medium mb-2">학습 목표</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.goals}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">예정된 수업</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/teacher/lessons?student=${profile.user.id}`}>전체 보기</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingLessons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  예정된 수업이 없습니다
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingLessons.map((lesson) => {
                    const date = new Date(lesson.scheduled_at)
                    return (
                      <Link
                        key={lesson.id}
                        href={`/teacher/lessons/${lesson.id}`}
                        className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="font-medium text-sm">
                          {lesson.title || '보컬 레슨'}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{date.toLocaleDateString('ko-KR')}</span>
                          <span>{date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                          <Badge variant="secondary" className="text-xs">
                            {lesson.duration}분
                          </Badge>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">최근 피드백</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {recentFeedback.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  아직 피드백이 없습니다
                </div>
              ) : (
                <div className="space-y-3">
                  {recentFeedback.map((feedback) => {
                    const date = new Date(feedback.created_at)
                    return (
                      <div
                        key={feedback.id}
                        className="p-3 rounded-lg border"
                      >
                        <p className="text-sm line-clamp-2 text-muted-foreground">
                          {feedback.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{date.toLocaleDateString('ko-KR')}</span>
                          {feedback.rating && (
                            <Badge variant="secondary" className="text-xs">
                              {feedback.rating}/5
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
