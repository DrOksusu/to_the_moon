'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { StudentNav } from '@/components/student/student-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, MapPin, FileText } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface Lesson {
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
  }
  student: {
    id: string
    name: string
  }
  feedback: {
    id: string
    rating: number
  } | null
}

export default function StudentLessons() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'scheduled' | 'completed' | 'cancelled'>('scheduled')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && user.role !== 'student') {
      router.push('/teacher/dashboard')
      return
    }

    if (user) {
      fetchLessons()
    }
  }, [user, loading, router])

  const fetchLessons = async () => {
    try {
      setIsLoading(true)
      const data = await api.get<Lesson[]>('/lessons')
      setLessons(data)
    } catch (error) {
      console.error('Error fetching lessons:', error)
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

  const scheduledLessons = lessons.filter((lesson) => lesson.status === 'scheduled')
  const completedLessons = lessons.filter((lesson) => lesson.status === 'completed')
  const cancelledLessons = lessons.filter((lesson) => lesson.status === 'cancelled')

  const renderLessonCard = (lesson: Lesson) => (
    <Card key={lesson.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{lesson.title || '레슨'}</span>
          {lesson.feedback && (
            <span className="text-sm font-normal text-yellow-600">
              ★ {lesson.feedback.rating}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {lesson.teacher.name} 선생님
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {new Date(lesson.scheduled_at).toLocaleString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{lesson.duration}분</span>
        </div>
        {lesson.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{lesson.location}</span>
          </div>
        )}
        {lesson.notes && (
          <div className="flex items-start gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">{lesson.notes}</span>
          </div>
        )}
        <div className="pt-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/student/lessons/${lesson.id}`}>
              상세보기
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <StudentNav />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">레슨 일정</h1>
          <p className="text-muted-foreground mt-2">
            전체 {lessons.length}개의 레슨
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="scheduled">
              예정 ({scheduledLessons.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              완료 ({completedLessons.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              취소 ({cancelledLessons.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="mt-6">
            {scheduledLessons.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <p className="text-center text-muted-foreground">
                    예정된 레슨이 없습니다.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scheduledLessons.map(renderLessonCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedLessons.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <p className="text-center text-muted-foreground">
                    완료된 레슨이 없습니다.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedLessons.map(renderLessonCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="mt-6">
            {cancelledLessons.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <p className="text-center text-muted-foreground">
                    취소된 레슨이 없습니다.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cancelledLessons.map(renderLessonCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
