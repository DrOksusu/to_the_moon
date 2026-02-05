'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { TeacherNav } from '@/components/teacher/teacher-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Calendar, Clock, MessageCircle, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Lesson {
  id: string
  teacher_id: string
  student_id: string
  title?: string
  scheduled_at: string
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled'
  location?: string
  notes?: string
  created_at: string
  updated_at: string
  student?: {
    id: string
    name: string
    email: string
  }
  feedback?: {
    id: string
    rating: number
    student_reaction?: string | null
    student_message?: string | null
    student_reacted_at?: string | null
  } | null
}

// 상대 시간 포맷 함수
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR')
}

export default function LessonsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoadingLessons, setIsLoadingLessons] = useState(true)
  const [studentFilter, setStudentFilter] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  useEffect(() => {
    // URL에서 student 파라미터 읽기
    const params = new URLSearchParams(window.location.search)
    setStudentFilter(params.get('student'))
  }, [])

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'teacher')) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setIsLoadingLessons(true)
        const data = await api.get<Lesson[]>('/lessons')
        console.log('Lessons fetched:', data)
        setLessons(data)
      } catch (error) {
        console.error('Failed to fetch lessons:', error)
        toast({
          title: '오류',
          description: '레슨 목록을 불러오지 못했습니다',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingLessons(false)
      }
    }

    if (user && user.role === 'teacher') {
      fetchLessons()
    }
  }, [user, toast])

  const handleRestoreLesson = async (lessonId: string) => {
    try {
      setRestoringId(lessonId)
      await api.patch("/lessons/" + lessonId + "/restore", {})
      toast({
        title: '재예약 완료',
        description: '수업이 다시 예약되었습니다',
      })
      // Refresh lessons
      const data = await api.get<Lesson[]>('/lessons')
      setLessons(data)
    } catch (error) {
      console.error('Failed to restore lesson:', error)
      toast({
        title: '오류',
        description: '수업 재예약에 실패했습니다',
        variant: 'destructive',
      })
    } finally {
      setRestoringId(null)
    }
  }

  if (isLoading || !user) {
    return <div>로딩중...</div>
  }

  if (isLoadingLessons) {
    return (
      <div className="min-h-screen bg-background">
        <TeacherNav />
        <div className="container mx-auto p-6">
          <div className="text-center">레슨 목록을 불러오는 중...</div>
        </div>
      </div>
    )
  }

  // 학생 필터링 적용
  const filteredLessons = studentFilter
    ? lessons.filter(l => l.student?.id === studentFilter)
    : lessons

  const upcomingLessons = filteredLessons.filter(l => l.status === 'scheduled')
  const pastLessons = filteredLessons.filter(l => l.status === 'completed' || l.status === 'cancelled')

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">수업 일정</h1>
            <p className="text-muted-foreground">
              {studentFilter
                ? `특정 학생의 레슨 일정`
                : '레슨 일정을 관리하세요'}
            </p>
          </div>
          <div className="flex gap-2">
            {studentFilter && (
              <Button variant="outline" onClick={() => router.push('/teacher/lessons')}>
                전체 보기
              </Button>
            )}
            <Button asChild>
              <Link href="/teacher/lessons/new">
                <Plus className="mr-2 h-4 w-4" />
                새 레슨 등록
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">예정된 수업</TabsTrigger>
            <TabsTrigger value="past">지난 수업</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 mt-4">
            {upcomingLessons.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  예정된 수업이 없습니다
                </CardContent>
              </Card>
            ) : (
              upcomingLessons.map((lesson) => (
                <Card key={lesson.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>
                          {lesson.title || '레슨'}
                          {lesson.student && ` - ${lesson.student.name}`}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(lesson.scheduled_at).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'short',
                            })}
                            {' '}
                            {new Date(lesson.scheduled_at).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {lesson.duration}분
                          </span>
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{lesson.status === 'scheduled' ? '예정' : lesson.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {lesson.location && (
                      <p className="text-sm text-muted-foreground mb-2">장소: {lesson.location}</p>
                    )}
                    {lesson.notes && (
                      <p className="text-sm mb-4">{lesson.notes}</p>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/teacher/lessons/${lesson.id}`}>상세보기</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-4">
            {pastLessons.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  지난 수업이 없습니다
                </CardContent>
              </Card>
            ) : (
              pastLessons.map((lesson) => (
                <Card key={lesson.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>
                          {lesson.title || '레슨'}
                          {lesson.student && ` - ${lesson.student.name}`}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(lesson.scheduled_at).toLocaleDateString('ko-KR')}
                            {' '}
                            {new Date(lesson.scheduled_at).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {lesson.duration}분
                          </span>
                        </CardDescription>
                      </div>
                      <Badge variant={lesson.status === 'completed' ? 'default' : 'secondary'}>
                        {lesson.status === 'completed' ? '완료' : '취소'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lesson.notes && (
                      <p className="text-sm text-muted-foreground">{lesson.notes}</p>
                    )}

                    {/* 학생 반응 영역 */}
                    {lesson.feedback?.student_reaction && (
                      <Link
                        href={`/teacher/lessons/${lesson.id}/feedback`}
                        className="flex items-center gap-3 p-3 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100 transition-colors"
                      >
                        <span className="text-2xl">{lesson.feedback.student_reaction}</span>
                        <div className="flex-1 min-w-0">
                          {lesson.feedback.student_message ? (
                            <p className="text-sm text-gray-700 truncate">"{lesson.feedback.student_message}"</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">학생이 반응을 보냈습니다</p>
                          )}
                          {lesson.feedback.student_reacted_at && (
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(new Date(lesson.feedback.student_reacted_at))}
                            </p>
                          )}
                        </div>
                      </Link>
                    )}

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/teacher/lessons/${lesson.id}`}>상세보기</Link>
                      </Button>
                      {lesson.status === 'completed' && (
                        <Button size="sm" asChild variant={lesson.feedback ? 'secondary' : 'default'}>
                          <Link href={`/teacher/lessons/${lesson.id}/feedback`}>
                            {lesson.feedback ? '피드백 수정' : '피드백 작성'}
                          </Link>
                        </Button>
                      )}
                      {lesson.status === 'cancelled' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRestoreLesson(lesson.id)}
                          disabled={restoringId === lesson.id}
                        >
                          <RotateCcw className={"mr-1 h-3 w-3 " + (restoringId === lesson.id ? "animate-spin" : "")} />
                          {restoringId === lesson.id ? '처리중...' : '재예약'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
