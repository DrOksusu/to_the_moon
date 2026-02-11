'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TeacherNav } from '@/components/teacher/teacher-nav'
import { Input } from '@/components/ui/input'
import { Calendar, Phone, Mail, Music, TrendingUp, Clock, MessageSquare, Trash2, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

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

// 달 도달에 필요한 총 포인트
const MOON_POINTS = 1000

interface StickerLevelCount {
  level: string
  order: number
  name: string
  emoji: string
  points: number
  count: number
}

interface StickerStats {
  totalCount: number
  totalPoints: number
  levelCounts: StickerLevelCount[]
  latestSticker: any | null
}

interface Sticker {
  id: string
  level: string
  comment?: string
  created_at: string
  meta: StickerMeta
  lesson?: {
    id: string
    title?: string
    scheduled_at: string
  }
}

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
  const [stickerStats, setStickerStats] = useState<StickerStats | null>(null)
  const [recentStickers, setRecentStickers] = useState<Sticker[]>([])
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null)
  const [stickerComment, setStickerComment] = useState('')
  const [isSendingSticker, setIsSendingSticker] = useState(false)

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

      // Fetch sticker stats and recent stickers
      try {
        const [statsData, stickersData] = await Promise.all([
          api.get<StickerStats>(`/stickers/stats?student_id=${profileData.user.id}`),
          api.get<Sticker[]>(`/stickers?student_id=${profileData.user.id}&limit=5`),
        ])
        setStickerStats(statsData)
        setRecentStickers(stickersData)
      } catch (error) {
        console.log('Sticker data not available yet')
      }
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

  const handleSendSticker = async () => {
    if (!selectedSticker || !profile) return

    try {
      setIsSendingSticker(true)
      await api.post('/stickers', {
        student_id: profile.user.id,
        level: selectedSticker,
        comment: stickerComment || null,
      })

      const meta = STICKER_LEVELS.find(s => s.level === selectedSticker)
      toast({
        title: '스티커 발행 완료!',
        description: `${meta?.emoji} ${meta?.name} 스티커를 ${profile.user.name} 학생에게 보냈습니다`,
      })

      // 초기화 및 데이터 새로고침
      setSelectedSticker(null)
      setStickerComment('')
      fetchStudentData()
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '스티커 발행에 실패했습니다',
        variant: 'destructive',
      })
    } finally {
      setIsSendingSticker(false)
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

        {/* 스티커 섹션 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                레벨 스티커
              </CardTitle>
              {stickerStats && (
                <div className="text-sm text-muted-foreground">
                  총 {stickerStats.totalCount}개 · {stickerStats.totalPoints}pt
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 여정 프로그레스바 */}
            {stickerStats && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>🌍 지구</span>
                  <span className="text-muted-foreground">
                    {stickerStats.totalPoints} / {MOON_POINTS}pt
                  </span>
                  <span>🌕 달</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stickerStats.totalPoints / MOON_POINTS) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* 레벨별 통계 */}
            {stickerStats && (
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {stickerStats.levelCounts.map((lc) => (
                  <div
                    key={lc.level}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border bg-muted/30"
                  >
                    <span className="text-xl">{lc.emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{lc.name}</span>
                    <Badge variant={lc.count > 0 ? 'default' : 'secondary'} className="text-xs px-1.5">
                      {lc.count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* 최근 스티커 히스토리 */}
            {recentStickers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">최근 받은 스티커</h4>
                <div className="space-y-2">
                  {recentStickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      className="flex items-center gap-3 p-2 rounded-lg border text-sm"
                    >
                      <span className="text-xl">{sticker.meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{sticker.meta.name}</div>
                        {sticker.comment && (
                          <p className="text-xs text-muted-foreground truncate">
                            {sticker.comment}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(sticker.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 스티커 발행 */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-medium">스티커 발행하기</h4>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {STICKER_LEVELS.map((sticker) => (
                  <button
                    key={sticker.level}
                    type="button"
                    onClick={() =>
                      setSelectedSticker(
                        selectedSticker === sticker.level ? null : sticker.level
                      )
                    }
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      selectedSticker === sticker.level
                        ? 'border-amber-400 bg-amber-50 shadow-md scale-105'
                        : 'border-muted hover:border-amber-200 hover:bg-amber-50/50'
                    }`}
                  >
                    <span className="text-2xl">{sticker.emoji}</span>
                    <span className="text-[10px] font-medium leading-tight text-center">
                      {sticker.name}
                    </span>
                  </button>
                ))}
              </div>

              {selectedSticker && (
                <div className="flex gap-2">
                  <Input
                    value={stickerComment}
                    onChange={(e) => setStickerComment(e.target.value)}
                    placeholder="한줄 코멘트 (선택)"
                    maxLength={200}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendSticker}
                    disabled={isSendingSticker}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    {isSendingSticker ? '발행 중...' : `${STICKER_LEVELS.find(s => s.level === selectedSticker)?.emoji} 발행`}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
