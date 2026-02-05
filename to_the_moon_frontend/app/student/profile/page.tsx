'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { StudentNav } from '@/components/student/student-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Phone, Calendar, Mic2, TrendingUp, Target } from 'lucide-react'
import { api } from '@/lib/api'

interface ProfileData {
  id: string
  user_id: string
  teacher_id: string
  voice_type: string | null
  level: string | null
  start_date: string
  goals: string | null
  created_at: string
  updated_at: string
  teacher: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  student: {
    id: string
    name: string
    email: string
    phone: string | null
  }
}

export default function StudentProfile() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
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
      fetchProfile()
    }
  }, [user, loading, router])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const data = await api.get<ProfileData>('/student/profile')
      console.log('Profile data received:', data)
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <StudentNav />
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-muted-foreground">프로필을 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNav />
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">프로필</h1>
          <p className="text-muted-foreground mt-2">
            나의 학습 정보
          </p>
        </div>

        <div className="space-y-6">
          {/* Student Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                학생 정보
              </CardTitle>
              <CardDescription>기본 정보</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">이름</p>
                    <p className="text-sm text-muted-foreground">{profile.student.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">이메일</p>
                    <p className="text-sm text-muted-foreground">{profile.student.email}</p>
                  </div>
                </div>

                {profile.student.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">연락처</p>
                      <p className="text-sm text-muted-foreground">{profile.student.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">레슨 시작일</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(profile.start_date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vocal Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic2 className="h-5 w-5" />
                보컬 정보
              </CardTitle>
              <CardDescription>목소리 및 수준 정보</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.voice_type && (
                  <div className="flex items-center gap-3">
                    <Mic2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">음역대</p>
                      <p className="text-sm text-muted-foreground">{profile.voice_type}</p>
                    </div>
                  </div>
                )}

                {profile.level && (
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">레벨</p>
                      <p className="text-sm text-muted-foreground">{profile.level}</p>
                    </div>
                  </div>
                )}
              </div>

              {profile.goals && (
                <div className="pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">학습 목표</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {profile.goals}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teacher Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                담당 선생님
              </CardTitle>
              <CardDescription>선생님 연락처</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">이름</p>
                    <p className="text-sm text-muted-foreground">{profile.teacher.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">이메일</p>
                    <p className="text-sm text-muted-foreground">{profile.teacher.email}</p>
                  </div>
                </div>

                {profile.teacher.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">연락처</p>
                      <p className="text-sm text-muted-foreground">{profile.teacher.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
