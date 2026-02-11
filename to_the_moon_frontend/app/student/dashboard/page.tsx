'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { StudentNav } from '@/components/student/student-nav'
import { AnnouncementBanner } from '@/components/student/announcement-banner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MessageSquare, Trophy, User, Clock, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface StickerMeta {
  level: string
  order: number
  name: string
  emoji: string
  points: number
}

const STICKER_LEVELS: StickerMeta[] = [
  { level: 'seed', order: 1, name: '씨앗', emoji: '🌱', points: 10 },
  { level: 'bloom', order: 2, name: '꽃봉오리', emoji: '🌸', points: 20 },
  { level: 'shooting_star', order: 3, name: '별똥별', emoji: '🌠', points: 30 },
  { level: 'rocket', order: 4, name: '로켓', emoji: '🚀', points: 50 },
  { level: 'satellite', order: 5, name: '위성', emoji: '🛰️', points: 70 },
  { level: 'aurora', order: 6, name: '오로라', emoji: '🌌', points: 85 },
  { level: 'to_the_moon', order: 7, name: '투더문', emoji: '🌕', points: 100 },
]

const MOON_POINTS = 1000

interface StickerLevelCount extends StickerMeta {
  count: number
}

interface StickerStats {
  totalCount: number
  totalPoints: number
  levelCounts: StickerLevelCount[]
  latestSticker: {
    id: string
    level: string
    comment?: string
    created_at: string
    meta: StickerMeta
    teacher?: { id: string; name: string }
  } | null
}

interface StickerItem {
  id: string
  level: string
  comment?: string
  created_at: string
  meta: StickerMeta
  teacher?: { id: string; name: string }
  lesson?: { id: string; title?: string; scheduled_at: string }
}

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
  const [stickerStats, setStickerStats] = useState<StickerStats | null>(null)
  const [recentStickers, setRecentStickers] = useState<StickerItem[]>([])

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

      // Fetch sticker data
      try {
        const [statsData, stickersData] = await Promise.all([
          api.get<StickerStats>('/stickers/stats'),
          api.get<StickerItem[]>('/stickers?limit=5'),
        ])
        setStickerStats(statsData)
        setRecentStickers(stickersData)
      } catch (error) {
        console.log('Sticker data not available yet')
      }
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

        {/* Sticker Collection */}
        {stickerStats && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  나의 스티커 컬렉션
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  총 {stickerStats.totalCount}개 · {stickerStats.totalPoints}pt
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 여정 프로그레스바 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>🌍 지구</span>
                  <span className="text-muted-foreground font-medium">
                    {stickerStats.totalPoints} / {MOON_POINTS}pt
                  </span>
                  <span>🌕 달</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stickerStats.totalPoints / MOON_POINTS) * 100, 100)}%` }}
                  />
                </div>
                {stickerStats.totalPoints >= MOON_POINTS && (
                  <p className="text-center text-sm font-medium text-amber-600">
                    🎉 달에 도착했습니다! 투더문!
                  </p>
                )}
              </div>

              {/* 레벨별 통계 */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {stickerStats.levelCounts.map((lc) => (
                  <div
                    key={lc.level}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${
                      lc.count > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/30'
                    }`}
                  >
                    <span className="text-2xl">{lc.emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{lc.name}</span>
                    <Badge variant={lc.count > 0 ? 'default' : 'secondary'} className="text-xs px-1.5">
                      {lc.count}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* 최근 받은 스티커 */}
              {recentStickers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">최근 받은 스티커</h4>
                  <div className="space-y-2">
                    {recentStickers.map((sticker) => (
                      <div
                        key={sticker.id}
                        className="flex items-center gap-3 p-3 rounded-lg border text-sm"
                      >
                        <span className="text-2xl">{sticker.meta.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{sticker.meta.name}</div>
                          {sticker.comment && (
                            <p className="text-xs text-muted-foreground truncate">
                              &ldquo;{sticker.comment}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-muted-foreground">
                            {new Date(sticker.created_at).toLocaleDateString('ko-KR')}
                          </div>
                          {sticker.teacher && (
                            <div className="text-xs text-muted-foreground">
                              {sticker.teacher.name} 선생님
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stickerStats.totalCount === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  아직 받은 스티커가 없습니다. 레슨을 열심히 들으면 선생님이 스티커를 줄 거예요!
                </p>
              )}
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
