'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AdminNav } from '@/components/admin/admin-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Star, Edit, X } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Lesson {
  id: string
  title?: string
  scheduled_at: string
  duration: number
  status: string
  location?: string
  notes?: string
  users_lessons_teacher_idTousers: {
    id: string
    name: string
    email: string
  }
  users_lessons_student_idTousers: {
    id: string
    name: string
    email: string
  }
  feedbacks?: {
    id: string
    rating: number
    content: string
  }
}

function AdminLessonsContent() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const initialTab = searchParams.get('tab') || 'all'
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && user.is_admin) {
      fetchLessons()
    }
  }, [user, activeTab])

  const fetchLessons = async () => {
    try {
      setLoading(true)
      const statusParam = activeTab === 'upcoming' ? '?status=upcoming' : activeTab === 'past' ? '?status=past' : ''
      const data = await api.get<Lesson[]>(`/admin/lessons${statusParam}`)
      setLessons(data)
    } catch (error) {
      console.error('Failed to fetch lessons:', error)
      toast({
        title: '오류',
        description: '레슨 목록을 불러올 수 없습니다',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const cancelLesson = async (lessonId: string) => {
    if (!confirm('정말 이 레슨을 취소하시겠습니까?')) return

    try {
      setCancelling(lessonId)
      await api.patch(`/admin/lessons/${lessonId}/cancel`)
      toast({
        title: '성공',
        description: '레슨이 취소되었습니다',
      })
      fetchLessons()
    } catch (error) {
      console.error('Failed to cancel lesson:', error)
      toast({
        title: '오류',
        description: '레슨 취소에 실패했습니다',
        variant: 'destructive',
      })
    } finally {
      setCancelling(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">예정</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">완료</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">취소</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const isUpcoming = (lesson: Lesson) => {
    return lesson.status === 'scheduled' && new Date(lesson.scheduled_at) > new Date()
  }

  if (isLoading || !user || !user.is_admin) {
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
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">레슨 관리</h1>
          <p className="text-muted-foreground">전체 레슨 현황을 확인하세요</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">전체 레슨</TabsTrigger>
            <TabsTrigger value="upcoming">예정된 레슨</TabsTrigger>
            <TabsTrigger value="past">완료된 레슨</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="text-center py-12">레슨 목록을 불러오는 중...</div>
            ) : lessons.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    {activeTab === 'upcoming' && '예정된 레슨이 없습니다'}
                    {activeTab === 'past' && '완료된 레슨이 없습니다'}
                    {activeTab === 'all' && '레슨이 없습니다'}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {lessons.map((lesson) => (
                  <Card key={lesson.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {lesson.title || '레슨'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(lesson.scheduled_at).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </CardDescription>
                        </div>
                        {getStatusBadge(lesson.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">선생님:</span>
                          <span className="font-medium">{lesson.users_lessons_teacher_idTousers.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">학생:</span>
                          <span className="font-medium">{lesson.users_lessons_student_idTousers.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">수업 시간:</span>
                        <span>{lesson.duration}분</span>
                      </div>

                      {lesson.location && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">장소: </span>
                          <span>{lesson.location}</span>
                        </div>
                      )}

                      {lesson.notes && (
                        <div className="text-sm pt-2 border-t">
                          <span className="text-muted-foreground">메모: </span>
                          <span>{lesson.notes}</span>
                        </div>
                      )}

                      {lesson.feedbacks && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">평점: {lesson.feedbacks.rating}/5</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{lesson.feedbacks.content}</p>
                        </div>
                      )}

                      {isUpcoming(lesson) && (
                        <div className="flex gap-2 pt-3 border-t">
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <Link href={`/admin/lessons/${lesson.id}/edit`}>
                              <Edit className="h-4 w-4 mr-1" />
                              수정
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => cancelLesson(lesson.id)}
                            disabled={cancelling === lesson.id}
                          >
                            <X className="h-4 w-4 mr-1" />
                            {cancelling === lesson.id ? '취소 중...' : '취소'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function AdminLessonsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <AdminNav />
        <div className="container mx-auto p-6">
          <div className="text-center">로딩중...</div>
        </div>
      </div>
    }>
      <AdminLessonsContent />
    </Suspense>
  )
}
