'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { TeacherNav } from '@/components/teacher/teacher-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Calendar, FileText, Plus, List, CalendarDays, MessageCircle, Heart } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

interface Student {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
  voice_type: string
  level: string
  start_date: string
  goals?: string
}

interface Lesson {
  id: string
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
  } | null
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Lesson
}

interface Feedback {
  id: string
  lesson_id: string
  student_reaction: string | null
  student_message: string | null
  student_reacted_at: string | null
  teacher_viewed_reaction_at: string | null
  created_at: string
  lessons: {
    id: string
    title: string | null
    scheduled_at: string
  }
  users_feedbacks_student_idTousers: {
    id: string
    name: string
  }
}

const locales = {
  ko: ko,
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

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export default function TeacherDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0)
  const [recentReactions, setRecentReactions] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'teacher')) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [studentsData, scheduledLessonsData, allLessonsData, feedbacksData] = await Promise.all([
        api.get<Student[]>('/teacher/students'),
        api.get<Lesson[]>('/lessons?status=scheduled'),
        api.get<Lesson[]>('/lessons'),
        api.get<Feedback[]>('/feedback'),
      ])
      console.log('Dashboard - Students data:', studentsData)
      console.log('Dashboard - Students count:', studentsData?.length || 0)
      console.log('Dashboard - Scheduled lessons from API:', scheduledLessonsData)
      console.log('Dashboard - Scheduled lessons count:', scheduledLessonsData?.length || 0)
      console.log('Dashboard - All lessons data:', allLessonsData)
      console.log('Dashboard - All lessons count:', allLessonsData?.length || 0)
      setStudents(studentsData)
      setLessons(scheduledLessonsData)

      // 학생 반응이 있는 피드백만 필터링 (최신순)
      const reactedFeedbacks = feedbacksData
        .filter(f => f.student_reaction)
        .sort((a, b) => {
          const dateA = a.student_reacted_at ? new Date(a.student_reacted_at).getTime() : 0
          const dateB = b.student_reacted_at ? new Date(b.student_reacted_at).getTime() : 0
          return dateB - dateA
        })
      setRecentReactions(reactedFeedbacks.slice(0, 5))

      // 피드백 작성 가능한 레슨 계산 (완료된 레슨 또는 시작된 레슨)
      const now = new Date()
      const feedbackEligibleLessons = allLessonsData.filter(l =>
        l.status === 'completed' ||
        (l.status === 'scheduled' && new Date(l.scheduled_at) <= now)
      )
      const lessonsNeedingFeedback = feedbackEligibleLessons.filter(l => {
        // feedback이 null, undefined, 빈 배열, 또는 빈 객체인 경우 체크
        if (!l.feedback) return true
        if (Array.isArray(l.feedback) && l.feedback.length === 0) return true
        if (typeof l.feedback === 'object' && Object.keys(l.feedback).length === 0) return true
        return false
      })
      setPendingFeedbackCount(lessonsNeedingFeedback.length)
      console.log('Dashboard - Feedback eligible lessons:', feedbackEligibleLessons.length)
      console.log('Dashboard - Lessons needing feedback:', lessonsNeedingFeedback.length)
      console.log('Dashboard - Feedback data sample:', feedbackEligibleLessons.map(l => ({ id: l.id, status: l.status, scheduled_at: l.scheduled_at, feedback: l.feedback })))
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !user) {
    return <div>로딩중...</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TeacherNav />
        <div className="container mx-auto p-6">
          <div className="text-center">대시보드를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  const upcomingLessons = lessons.filter(l => l.status === 'scheduled')

  // 캘린더 이벤트 준비
  const calendarEvents: CalendarEvent[] = upcomingLessons.map(lesson => {
    const start = new Date(lesson.scheduled_at)
    const end = new Date(start.getTime() + lesson.duration * 60000) // duration in minutes
    const timeStr = start.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    // 학생 이름의 첫 글자(성)만 추출
    const lastName = lesson.student.name.charAt(0)
    return {
      id: lesson.id,
      title: `${lastName} ${timeStr}`,
      start,
      end,
      resource: lesson,
    }
  })

  // 선택된 날짜의 수업 필터링
  const selectedDateLessons = selectedDate
    ? upcomingLessons.filter(lesson => {
        const lessonDate = new Date(lesson.scheduled_at)
        return (
          lessonDate.getFullYear() === selectedDate.getFullYear() &&
          lessonDate.getMonth() === selectedDate.getMonth() &&
          lessonDate.getDate() === selectedDate.getDate()
        )
      })
    : []

  console.log('Calendar events:', calendarEvents)
  console.log('Upcoming lessons:', upcomingLessons)
  console.log('Current viewMode:', viewMode)

  // 커스텀 날짜 셀 헤더 (날짜 클릭 시 모달 열기)
  const CustomDateHeader = ({ date, label }: { date: Date; label: string }) => {
    const dayLessons = upcomingLessons.filter(lesson => {
      const lessonDate = new Date(lesson.scheduled_at)
      return (
        lessonDate.getFullYear() === date.getFullYear() &&
        lessonDate.getMonth() === date.getMonth() &&
        lessonDate.getDate() === date.getDate()
      )
    })

    return (
      <div
        onClick={(e) => {
          if (dayLessons.length > 0) {
            e.stopPropagation()
            console.log('Date header clicked:', date, dayLessons)
            setSelectedDate(date)
          }
        }}
        className={dayLessons.length > 0 ? 'cursor-pointer hover:bg-accent/50 rounded' : ''}
      >
        {label}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{user.name} 선생님</h1>
            <p className="text-muted-foreground">오늘의 레슨 일정을 확인하세요</p>
          </div>
          <Button asChild>
            <Link href="/teacher/lessons/new">
              <Plus className="mr-2 h-4 w-4" />
              수업 등록
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/teacher/students">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">전체 학생</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students.length}명</div>
                <p className="text-xs text-muted-foreground">활동 중인 학생</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/teacher/lessons">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">예정된 수업</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingLessons.length}개</div>
                <p className="text-xs text-muted-foreground">이번 주 수업</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/teacher/lessons">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">피드백 작성</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingFeedbackCount}개</div>
                <p className="text-xs text-muted-foreground">작성 대기 중</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 최근 학생 반응 섹션 */}
        {recentReactions.length > 0 && (
          <Card className="border-pink-200 bg-gradient-to-r from-pink-50/50 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                최근 학생 반응
              </CardTitle>
              <CardDescription>학생들이 피드백에 보낸 반응</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentReactions.map((feedback) => {
                  const isViewed = !!feedback.teacher_viewed_reaction_at
                  return (
                    <Link
                      key={feedback.id}
                      href={`/teacher/lessons/${feedback.lesson_id}/feedback`}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        isViewed
                          ? 'opacity-50 hover:opacity-70'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={async (e) => {
                        if (!isViewed) {
                          try {
                            await api.patch(`/feedback/${feedback.id}/view-reaction`)
                            setRecentReactions(prev =>
                              prev.map(f =>
                                f.id === feedback.id
                                  ? { ...f, teacher_viewed_reaction_at: new Date().toISOString() }
                                  : f
                              )
                            )
                          } catch (error) {
                            console.error('Failed to mark reaction as viewed:', error)
                          }
                        }
                      }}
                    >
                      <span className={`text-2xl ${isViewed ? 'grayscale' : ''}`}>
                        {feedback.student_reaction}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isViewed ? 'text-muted-foreground' : ''}`}>
                            {feedback.users_feedbacks_student_idTousers.name}
                          </span>
                          {feedback.student_message && (
                            <MessageCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                          {!isViewed && (
                            <span className="h-2 w-2 rounded-full bg-pink-500" />
                          )}
                        </div>
                        {feedback.student_message && (
                          <p className="text-sm text-muted-foreground truncate">
                            "{feedback.student_message}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(feedback.lessons.scheduled_at).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                          })} {feedback.lessons.title || '레슨'} ·{' '}
                          {feedback.student_reacted_at &&
                            formatRelativeTime(new Date(feedback.student_reacted_at))
                          }
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>최근 학생</CardTitle>
              <CardDescription>등록된 학생 목록</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    등록된 학생이 없습니다
                  </p>
                ) : (
                  students.slice(0, 3).map((student) => (
                    <div key={student.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.voice_type || '-'} · {student.level || '-'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/teacher/students/${student.id}`}>상세보기</Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/teacher/students">전체 학생 보기</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>다가오는 수업</CardTitle>
                  <CardDescription>예정된 레슨 일정</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      console.log('Switching to list view')
                      setViewMode('list')
                    }}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      console.log('Switching to calendar view')
                      setViewMode('calendar')
                    }}
                  >
                    <CalendarDays className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'list' ? (
                <div className="space-y-4">
                  {upcomingLessons.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      예정된 수업이 없습니다
                    </p>
                  ) : (
                    upcomingLessons.slice(0, 3).map((lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{lesson.student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(lesson.scheduled_at).toLocaleDateString('ko-KR')} · {lesson.duration}분
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/teacher/lessons/${lesson.id}`}>상세보기</Link>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <>
                  <div className="h-[500px]">
                    <BigCalendar
                      localizer={localizer}
                      events={calendarEvents}
                      startAccessor="start"
                      endAccessor="end"
                      culture="ko"
                      messages={{
                        next: "다음",
                        previous: "이전",
                        today: "오늘",
                        month: "월",
                        week: "주",
                        day: "일",
                        agenda: "일정",
                        date: "날짜",
                        time: "시간",
                        event: "수업",
                        noEventsInRange: "이 기간에 예정된 수업이 없습니다",
                        showMore: (total) => `+${total}개 더보기`,
                      }}
                      defaultView="month"
                      views={['month', 'week', 'day']}
                      onSelectEvent={(event) => {
                        console.log('Event clicked:', event)
                        router.push(`/teacher/lessons/${event.id}`)
                      }}
                      onNavigate={(date) => {
                        console.log('Navigate to date:', date)
                      }}
                      onDrillDown={(date) => {
                        console.log('Drill down to date:', date)
                        setSelectedDate(date)
                      }}
                      onSelectSlot={(slotInfo) => {
                        console.log('Slot selected:', slotInfo)
                        setSelectedDate(slotInfo.start)
                      }}
                      onShowMore={(events, date) => {
                        console.log('Show more clicked:', date, events)
                        setSelectedDate(date)
                      }}
                      components={{
                        month: {
                          dateHeader: CustomDateHeader,
                        },
                      }}
                      style={{ height: '100%' }}
                      popup={false}
                      selectable={true}
                      drilldownView={null}
                    />
                  </div>

                  {/* 선택된 날짜의 수업 목록 모달 */}
                  {selectedDate && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedDate(null)}>
                      <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">
                            {selectedDate.toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} 수업
                          </h3>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                            닫기
                          </Button>
                        </div>
                        {selectedDateLessons.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            이 날짜에 예정된 수업이 없습니다
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {selectedDateLessons.map((lesson) => (
                              <div key={lesson.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">{lesson.student.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(lesson.scheduled_at).toLocaleTimeString('ko-KR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: false
                                    })} · {lesson.duration}분
                                  </p>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/teacher/lessons/${lesson.id}`}>상세보기</Link>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/teacher/lessons">전체 일정 보기</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
