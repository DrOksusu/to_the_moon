'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { TeacherNav } from '@/components/teacher/teacher-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, UserPlus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Student {
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
}

interface UnassignedStudent {
  id: string
  name: string
  email: string
  phone?: string
  created_at: string
}

export default function StudentsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [unassignedStudents, setUnassignedStudents] = useState<UnassignedStudent[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'teacher')) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchStudents()
      fetchUnassignedStudents()
    }
  }, [user])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const data = await api.get<Student[]>('/teacher/students')
      console.log('Students fetched from API:', data)
      console.log('Number of students:', data.length)
      setStudents(data)
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnassignedStudents = async () => {
    try {
      const data = await api.get<UnassignedStudent[]>('/teacher/students/unassigned')
      console.log('Unassigned students:', data)
      setUnassignedStudents(data)
    } catch (error) {
      console.error('Failed to fetch unassigned students:', error)
    }
  }

  const handleAssignStudent = async (studentId: string) => {
    try {
      await api.post('/teacher/students/assign', { student_id: studentId })
      toast({
        title: '성공',
        description: '학생이 배정되었습니다',
      })
      // Refresh both lists
      fetchStudents()
      fetchUnassignedStudents()
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '학생 배정에 실패했습니다',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`${studentName} 학생을 탈퇴 처리하시겠습니까?\n\n탈퇴 후에도 데이터는 보존되며, 학생 목록에서만 제거됩니다.`)) {
      return
    }

    try {
      await api.delete(`/teacher/students/${studentId}`)
      toast({
        title: '탈퇴 완료',
        description: '학생이 탈퇴 처리되었습니다',
      })
      fetchStudents()
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '학생 탈퇴 처리에 실패했습니다',
        variant: 'destructive',
      })
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
          <div className="text-center">학생 목록을 불러오는 중...</div>
        </div>
      </div>
    )
  }

  const filteredStudents = students.filter(student =>
    student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.voice_type && student.voice_type.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  console.log('Total students:', students.length)
  console.log('Filtered students:', filteredStudents.length)
  console.log('Search query:', searchQuery)

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">학생 관리</h1>
            <p className="text-muted-foreground">학생 정보를 조회하고 관리하세요</p>
          </div>
          <Button asChild>
            <Link href="/teacher/students/new">
              <Plus className="mr-2 h-4 w-4" />
              새 학생 등록
            </Link>
          </Button>
        </div>

        {unassignedStudents.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900">미배정 학생</CardTitle>
              <CardDescription className="text-orange-700">
                선생님이 배정되지 않은 학생들입니다. 클릭하여 자신에게 배정할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {unassignedStudents.map((student) => (
                  <Card key={student.id} className="bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{student.name}</CardTitle>
                      <CardDescription className="text-sm">{student.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => handleAssignStudent(student.id)}
                        className="w-full"
                        size="sm"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        내 학생으로 배정
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="학생 이름 또는 성부 검색..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">내 학생 목록</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
            </div>
          ) : (
            filteredStudents.map((student) => (
              <Card key={student.id}>
                <CardHeader>
                  <CardTitle>{student.user.name}</CardTitle>
                  <CardDescription>{student.user.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">성부</span>
                    <span className="font-medium">{student.voice_type || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">레벨</span>
                    <span className="font-medium">{student.level || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">시작일</span>
                    <span className="font-medium">
                      {new Date(student.start_date).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  {student.goals && (
                    <div className="text-sm pt-2 border-t">
                      <span className="text-muted-foreground">목표: </span>
                      <span>{student.goals}</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/teacher/students/${student.id}`}>상세보기</Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteStudent(student.id, student.user.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
