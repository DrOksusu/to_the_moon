'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AdminNav } from '@/components/admin/admin-nav'
import { Users, UserCheck, Calendar, TrendingUp } from 'lucide-react'
import { api } from '@/lib/api'

interface Stats {
  totalTeachers: number
  totalStudents: number
  activeStudents: number
  unassignedStudents: number
  totalLessons: number
  upcomingLessons: number
}

interface TeacherLessonStat {
  teacherId: string
  teacherName: string
  completedLessons: number
  scheduledLessons: number
  totalLessons: number
}

interface TeacherLessonStats {
  month: string
  stats: TeacherLessonStat[]
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [teacherLessonStats, setTeacherLessonStats] = useState<TeacherLessonStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && user.is_admin) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [statsData, teacherStatsData] = await Promise.all([
        api.get<Stats>('/admin/stats'),
        api.get<TeacherLessonStats>('/admin/teacher-lesson-stats'),
      ])
      setStats(statsData)
      setTeacherLessonStats(teacherStatsData)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !user) {
    return <div>로딩중...</div>
  }

  if (!user.is_admin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="max-w-2xl mx-auto px-4 py-2 space-y-2">
        <div>
          <h1 className="text-lg font-bold">관리자 대시보드</h1>
          <p className="text-[11px] text-muted-foreground">전체 시스템 현황</p>
        </div>

        {loading ? (
          <div className="text-center py-4 text-sm">통계를 불러오는 중...</div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
              <div
                className="border rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => router.push('/admin/teachers')}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">선생님</span>
                  <UserCheck className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-base font-bold">{stats.totalTeachers}명</p>
              </div>

              <div
                className="border rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => router.push('/admin/students')}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">학생</span>
                  <Users className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-base font-bold">{stats.totalStudents}명</p>
                <p className="text-[10px] text-muted-foreground">활성 {stats.activeStudents} · 미배정 {stats.unassignedStudents}</p>
              </div>

              <div
                className="border rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => router.push('/admin/lessons')}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">전체 레슨</span>
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-base font-bold">{stats.totalLessons}회</p>
              </div>

              <div
                className="border rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => router.push('/admin/lessons?tab=upcoming')}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">예정 레슨</span>
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-base font-bold">{stats.upcomingLessons}회</p>
              </div>
            </div>

            {stats.unassignedStudents > 0 && (
              <div
                className="bg-orange-50 border border-orange-200 rounded-md px-2 py-1.5 cursor-pointer hover:bg-orange-100 transition-colors"
                onClick={() => router.push('/admin/students')}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-orange-700">주의: 미배정 학생</span>
                  <span className="text-base font-bold text-orange-900">{stats.unassignedStudents}명</span>
                </div>
                <p className="text-[10px] text-orange-600">선생님 배정이 필요합니다</p>
              </div>
            )}

            {/* 이번 달 선생님별 레슨 현황 */}
            {teacherLessonStats && (
              <div className="border rounded-md px-2 py-1.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium">{teacherLessonStats.month} 선생님별 레슨 현황</span>
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                </div>
                {teacherLessonStats.stats.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">등록된 선생님이 없습니다.</p>
                ) : (
                  <div className="space-y-1">
                    {teacherLessonStats.stats.map((teacher) => (
                      <div
                        key={teacher.teacherId}
                        className="flex items-center justify-between py-1 border-b last:border-b-0 hover:bg-accent/50 cursor-pointer rounded px-1 -mx-1"
                        onClick={() => router.push(`/admin/lessons?teacher=${teacher.teacherId}`)}
                      >
                        <span className="text-[11px] font-medium">{teacher.teacherName}</span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-green-600">완료 {teacher.completedLessons}</span>
                          <span className="text-blue-600">예정 {teacher.scheduledLessons}</span>
                          <span className="text-muted-foreground">총 {teacher.totalLessons}회</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            통계를 불러올 수 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
