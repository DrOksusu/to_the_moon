'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { StudentNav } from '@/components/student/student-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, FileText, ArrowLeft, Trophy, Lightbulb, Target, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface LessonDetail {
  id: string
  title: string | null
  scheduled_at: string
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled'
  location: string | null
  notes: string | null
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
  feedback: {
    id: string
    rating: number
    content: string
    strengths: string | null
    improvements: string | null
    homework: string | null
    created_at: string
  } | null
}

export default function LessonDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && user.role !== 'student') {
      router.push('/teacher/dashboard')
      return
    }

    if (user && params.id) {
      fetchLesson()
    }
  }, [user, loading, router, params.id])

  const fetchLesson = async () => {
    try {
      setIsLoading(true)
      const data = await api.get<LessonDetail>(`/lessons/${params.id}`)
      setLesson(data)
    } catch (error) {
      console.error('Error fetching lesson:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <StudentNav />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background">
        <StudentNav />
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-muted-foreground">레슨을 찾을 수 없습니다.</p>
          <div className="mt-4 text-center">
            <Button variant="outline" asChild>
              <Link href="/student/lessons">
                <ArrowLeft className="h-4 w-4 mr-2" />
                목록으로 돌아가기
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="default">예정</Badge>
      case 'completed':
        return <Badge variant="secondary">완료</Badge>
      case 'cancelled':
        return <Badge variant="destructive">취소</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNav />
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/student/lessons">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로 돌아가기
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Lesson Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{lesson.title || '레슨'}</CardTitle>
                  <CardDescription className="mt-2">
                    {lesson.teacher.name} 선생님
                  </CardDescription>
                </div>
                {getStatusBadge(lesson.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">날짜 및 시간</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(lesson.scheduled_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">시간</p>
                    <p className="text-sm text-muted-foreground">{lesson.duration}분</p>
                  </div>
                </div>

                {lesson.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">장소</p>
                      <p className="text-sm text-muted-foreground">{lesson.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {lesson.notes && (
                <div className="pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">노트</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {lesson.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback Card */}
          {lesson.feedback ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  피드백
                </CardTitle>
                <CardDescription>
                  {new Date(lesson.feedback.created_at).toLocaleDateString('ko-KR')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">평점</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Trophy
                        key={i}
                        className={`h-5 w-5 ${
                          i < lesson.feedback!.rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {lesson.feedback.rating}/5
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">전체 피드백</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {lesson.feedback.content}
                  </p>
                </div>

                {lesson.feedback.strengths && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium">잘한 점</p>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {lesson.feedback.strengths}
                    </p>
                  </div>
                )}

                {lesson.feedback.improvements && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium">개선할 점</p>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {lesson.feedback.improvements}
                    </p>
                  </div>
                )}

                {lesson.feedback.homework && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                      <p className="text-sm font-medium">과제</p>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {lesson.feedback.homework}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : lesson.status === 'completed' ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  아직 피드백이 작성되지 않았습니다.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
