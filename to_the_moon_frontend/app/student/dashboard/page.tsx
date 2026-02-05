'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { StudentNav } from '@/components/student/student-nav'
import { AnnouncementBanner } from '@/components/student/announcement-banner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MessageSquare, Trophy, User, Clock } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface DashboardData {
  profile: {
    id: string
    user_id: string
    teacher_id: string
    voice_type: string | null
    level: string | null
    start_date: string
    goals: string | null
    users_student_profiles_teacher_idTousers: {
      id: string
      name: string
      email: string
      phone: string | null
    }
    users_student_profiles_user_idTousers: {
      id: string
      name: string
      email: string
    }
  } | null
  stats: {
    totalLessons: number
    completedLessons: number
    scheduledLessons: number
    totalFeedbacks: number
    averageRating: number
  }
  upcomingLessons: Array<{
    id: string
    title: string | null
    scheduled_at: string
    duration: number
    teacher: {
      id: string
      name: string
    }
  }>
  recentFeedbacks: Array<{
    id: string
    rating: number
    content: string
    created_at: string
    lessons: {
      id: string
      title: string | null
      scheduled_at: string
    }
    teacher: {
      id: string
      name: string
    }
  }>
}

export default function StudentDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
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

    if (user) {
      fetchDashboardData()
    }
  }, [user, loading, router])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const data = await api.get<DashboardData>('/student/dashboard')
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background">
        <StudentNav />
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }

  const { profile, stats, upcomingLessons, recentFeedbacks } = dashboardData

  return (
    <div className="min-h-screen bg-background">
      <StudentNav />
      <AnnouncementBanner />
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-muted-foreground mt-2">
            환영합니다, {user?.name}님!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 레슨</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLessons}</div>
              <p className="text-xs text-muted-foreground">
                완료: {stats.completedLessons}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">예정된 레슨</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scheduledLessons}</div>
              <p className="text-xs text-muted-foreground">
                다가오는 레슨
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">받은 피드백</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFeedbacks}</div>
              <p className="text-xs text-muted-foreground">
                총 피드백 수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 평점</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                5점 만점
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Teacher Info */}
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                선생님 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">이름</span>
                  <span className="font-medium">{profile.users_student_profiles_teacher_idTousers.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">이메일</span>
                  <span className="font-medium">{profile.users_student_profiles_teacher_idTousers.email}</span>
                </div>
                {profile.users_student_profiles_teacher_idTousers.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">연락처</span>
                    <span className="font-medium">{profile.users_student_profiles_teacher_idTousers.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Lessons */}
          <Card>
            <CardHeader>
              <CardTitle>다가오는 레슨</CardTitle>
              <CardDescription>예정된 레슨 목록</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingLessons.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  예정된 레슨이 없습니다.
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">
                          {lesson.title || '레슨'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(lesson.scheduled_at).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lesson.duration}분 · {lesson.teacher.name}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/student/lessons/${lesson.id}`}>
                          상세보기
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/student/lessons">모든 레슨 보기</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>최근 피드백</CardTitle>
              <CardDescription>받은 피드백 목록</CardDescription>
            </CardHeader>
            <CardContent>
              {recentFeedbacks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  받은 피드백이 없습니다.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentFeedbacks.map((feedback) => (
                    <Link
                      key={feedback.id}
                      href={`/student/feedback#feedback-${feedback.id}`}
                      className="block p-4 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {feedback.lessons.title || '레슨'}
                        </p>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{feedback.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {feedback.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(feedback.created_at).toLocaleDateString('ko-KR')} · {feedback.teacher.name}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/student/feedback">모든 피드백 보기</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
