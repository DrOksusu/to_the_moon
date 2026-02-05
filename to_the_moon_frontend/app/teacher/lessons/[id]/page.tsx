'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Calendar, Clock, MapPin, User, MessageSquare, Edit, CheckCircle2, Heart } from 'lucide-react'
import { TeacherNav } from '@/components/teacher/teacher-nav'
import { api } from '@/lib/api'

interface Lesson {
  id: string
  teacher_id: string
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
  feedback?: {
    id: string
    rating: number
    student_reaction?: string | null
    student_message?: string | null
    student_reacted_at?: string | null
  } | null
}

export default function LessonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'teacher')) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && user.role === 'teacher' && params.id) {
      fetchLesson()
    }
  }, [user, params.id])

  const fetchLesson = async () => {
    try {
      setLoading(true)
      const lessonId = params.id as string
      const lessonData = await api.get<Lesson>(`/lessons/${lessonId}`)
      setLesson(lessonData)
    } catch (error) {
      console.error('Failed to fetch lesson:', error)
      router.push('/teacher/lessons')
    } finally {
      setLoading(false)
    }
  }

  const updateLessonStatus = async (status: string) => {
    if (!lesson) return

    try {
      setUpdating(true)
      await api.put(`/lessons/${lesson.id}`, { status })
      setLesson({ ...lesson, status })
    } catch (error) {
      console.error('Failed to update lesson status:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (isLoading || !user) {
    return <div>로딩중...</div>
  }

  if (loading || !lesson) {
    return (
      <div className="min-h-screen bg-background">
        <TeacherNav />
        <div className="container mx-auto p-6">
          <div className="text-center">수업 정보를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  const date = new Date(lesson.scheduled_at)
  const isPast = date < new Date()

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav />

      <main className="container mx-auto p-6 max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">
                  {lesson.title || '보컬 레슨'}
                </CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{lesson.student.name}</span>
                </div>
              </div>
              <Badge className="capitalize">
                {lesson.status === 'scheduled' ? '예정' : lesson.status === 'completed' ? '완료' : '취소'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">날짜</div>
                  <div className="font-medium">{date.toLocaleDateString('ko-KR')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">시간</div>
                  <div className="font-medium">
                    {date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} ({lesson.duration}분)
                  </div>
                </div>
              </div>
              {lesson.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">장소</div>
                    <div className="font-medium">{lesson.location}</div>
                  </div>
                </div>
              )}
            </div>

            {lesson.notes && (
              <div>
                <h3 className="font-medium mb-2">메모</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {lesson.notes}
                </p>
              </div>
            )}

            {/* 학생 반응 표시 */}
            {lesson.feedback?.student_reaction && (
              <div className="p-4 rounded-lg bg-pink-50 border border-pink-200">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                  <span className="text-sm font-medium text-pink-700">학생의 반응</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{lesson.feedback.student_reaction}</span>
                  <div className="flex-1">
                    {lesson.feedback.student_message && (
                      <p className="text-sm text-gray-700 mb-1">"{lesson.feedback.student_message}"</p>
                    )}
                    {lesson.feedback.student_reacted_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(lesson.feedback.student_reacted_at).toLocaleString('ko-KR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              {isPast && lesson.status === 'scheduled' && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => updateLessonStatus('completed')}
                  disabled={updating}
                >
                  {updating ? '처리 중...' : '완료로 표시'}
                </Button>
              )}
              {(isPast || lesson.status === 'completed') && (
                <>
                  {lesson.feedback ? (
                    <>
                      <Button variant="outline" className="flex-1" disabled>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        피드백 완료
                      </Button>
                      <Button asChild variant="default" className="flex-1">
                        <Link href={`/teacher/lessons/${lesson.id}/feedback`}>
                          <Edit className="h-4 w-4 mr-2" />
                          피드백 수정
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button asChild className="flex-1">
                      <Link href={`/teacher/lessons/${lesson.id}/feedback`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        피드백 작성
                      </Link>
                    </Button>
                  )}
                </>
              )}
              {!isPast && lesson.status === 'scheduled' && (
                <>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/teacher/lessons/${lesson.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      스케줄 수정
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => updateLessonStatus('cancelled')}
                    disabled={updating}
                  >
                    {updating ? '처리 중...' : '수업 취소'}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
