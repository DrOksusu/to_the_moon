'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AdminNav } from '@/components/admin/admin-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'

interface Teacher {
  id: string
  name: string
  email: string
  phone?: string
}

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  profile?: {
    id: string
    teacher: {
      id: string
      name: string
      email: string
    }
  } | null
}

export default function AssignStudentPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const studentId = params.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && user.is_admin) {
      fetchData()
    }
  }, [user, studentId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // 학생 정보와 선생님 목록을 병렬로 가져오기
      const [studentsData, teachersData] = await Promise.all([
        api.get<Student[]>('/admin/students'),
        api.get<Teacher[]>('/admin/teachers'),
      ])

      const currentStudent = studentsData.find((s: Student) => s.id === studentId)
      if (!currentStudent) {
        toast({
          title: '오류',
          description: '학생을 찾을 수 없습니다',
          variant: 'destructive',
        })
        router.push('/admin/students')
        return
      }

      setStudent(currentStudent)
      setTeachers(teachersData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast({
        title: '오류',
        description: '데이터를 불러올 수 없습니다',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const isReassign = student?.profile != null

  const handleAssign = async () => {
    if (!selectedTeacherId) {
      toast({
        title: '오류',
        description: '선생님을 선택해주세요',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)

      if (isReassign && student?.profile) {
        // 이미 선생님이 배정된 경우 reassign API 사용
        await api.put('/admin/reassign-student', {
          studentProfileId: student.profile.id,
          newTeacherId: selectedTeacherId,
        })
        toast({
          title: '성공',
          description: '선생님이 변경되었습니다',
        })
      } else {
        // 새로 배정하는 경우 assign API 사용
        await api.post('/admin/assign-student', {
          studentId,
          teacherId: selectedTeacherId,
        })
        toast({
          title: '성공',
          description: '학생에게 선생님이 배정되었습니다',
        })
      }

      router.push('/admin/students')
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '선생님 배정에 실패했습니다',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading || !user || !user.is_admin || loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNav />
        <div className="container mx-auto p-6">
          <div className="text-center">로딩중...</div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNav />
        <div className="container mx-auto p-6">
          <div className="text-center">학생을 찾을 수 없습니다</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="container mx-auto p-6 max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/students')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{isReassign ? '선생님 변경' : '선생님 배정'}</h1>
            <p className="text-muted-foreground">{isReassign ? '학생의 담당 선생님을 변경하세요' : '학생에게 담당 선생님을 배정하세요'}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>학생 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">이름</span>
              <span className="font-medium">{student.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">이메일</span>
              <span className="font-medium">{student.email}</span>
            </div>
            {student.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">전화번호</span>
                <span className="font-medium">{student.phone}</span>
              </div>
            )}
            {isReassign && student.profile && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">현재 담당 선생님</span>
                <span className="font-medium">{student.profile.teacher.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isReassign ? '새 담당 선생님 선택' : '담당 선생님 선택'}</CardTitle>
            <CardDescription>{isReassign ? '변경할 선생님을 선택해주세요' : '학생에게 배정할 선생님을 선택해주세요'}</CardDescription>
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                등록된 선생님이 없습니다
              </div>
            ) : (
              <RadioGroup value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <div className="space-y-3">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center space-x-3 space-y-0">
                      <RadioGroupItem value={teacher.id} id={teacher.id} />
                      <Label
                        htmlFor={teacher.id}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{teacher.name}</div>
                            <div className="text-sm text-muted-foreground">{teacher.email}</div>
                          </div>
                          {teacher.phone && (
                            <div className="text-sm text-muted-foreground">{teacher.phone}</div>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/students')}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedTeacherId || submitting}
          >
            {submitting ? (isReassign ? '변경 중...' : '배정 중...') : (isReassign ? '선생님 변경하기' : '선생님 배정하기')}
          </Button>
        </div>
      </div>
    </div>
  )
}
