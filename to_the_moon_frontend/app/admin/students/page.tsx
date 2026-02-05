'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AdminNav } from '@/components/admin/admin-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Teacher {
  id: string
  name: string
  email: string
}

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  created_at: string
  profile: {
    id: string
    teacher: Teacher
    voice_type?: string
    level?: string
    start_date: string
    is_active: boolean
  } | null
}

export default function AdminStudentsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && user.is_admin) {
      fetchStudents()
    }
  }, [user])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const data = await api.get<Student[]>('/admin/students')
      setStudents(data)
    } catch (error) {
      console.error('Failed to fetch students:', error)
      toast({
        title: '오류',
        description: '학생 목록을 불러올 수 없습니다',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !user || !user.is_admin) {
    return <div>로딩중...</div>
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.profile?.teacher?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const assignedStudents = filteredStudents.filter(s => s.profile && s.profile.is_active)
  const unassignedStudents = filteredStudents.filter(s => !s.profile)

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">학생 관리</h1>
            <p className="text-muted-foreground">전체 학생 현황 및 선생님 배정 관리</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="학생 이름 또는 선생님 이름으로 검색..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {unassignedStudents.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900">미배정 학생 ({unassignedStudents.length}명)</CardTitle>
              <CardDescription className="text-orange-700">
                아직 선생님이 배정되지 않은 학생들입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {unassignedStudents.map((student) => (
                  <Card key={student.id} className="bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{student.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {student.email}
                        {student.phone && <><br />{student.phone}</>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => router.push(`/admin/students/${student.id}/assign`)}
                        className="w-full"
                        size="sm"
                      >
                        선생님 배정하기
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>배정된 학생 ({assignedStudents.length}명)</CardTitle>
            <CardDescription>선생님에게 배정된 학생 목록</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">학생 목록을 불러오는 중...</div>
            ) : assignedStudents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? '검색 결과가 없습니다.' : '배정된 학생이 없습니다.'}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {assignedStudents.map((student) => (
                  <Card key={student.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{student.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {student.email}
                        {student.phone && <><br />{student.phone}</>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">담당 선생님</span>
                        <span className="font-medium">{student.profile?.teacher.name}</span>
                      </div>
                      {student.profile?.voice_type && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">성부</span>
                          <span className="font-medium">{student.profile.voice_type}</span>
                        </div>
                      )}
                      {student.profile?.level && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">레벨</span>
                          <span className="font-medium">{student.profile.level}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">시작일</span>
                        <span className="font-medium">
                          {new Date(student.profile!.start_date).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        size="sm"
                        onClick={() => router.push(`/admin/students/${student.id}/assign`)}
                      >
                        선생님 변경
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
