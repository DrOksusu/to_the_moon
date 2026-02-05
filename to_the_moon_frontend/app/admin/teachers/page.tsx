'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AdminNav } from '@/components/admin/admin-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Shield } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Teacher {
  id: string
  name: string
  email: string
  phone?: string
  created_at: string
  is_admin: boolean
}

export default function AdminTeachersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && user.is_admin) {
      fetchTeachers()
    }
  }, [user])

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const data = await api.get<Teacher[]>('/admin/teachers')
      setTeachers(data)
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
      toast({
        title: '오류',
        description: '선생님 목록을 불러올 수 없습니다',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !user || !user.is_admin) {
    return <div>로딩중...</div>
  }

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">선생님 관리</h1>
          <p className="text-muted-foreground">등록된 선생님 목록 및 정보</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="선생님 이름 또는 이메일로 검색..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>전체 선생님 ({filteredTeachers.length}명)</CardTitle>
            <CardDescription>시스템에 등록된 선생님 목록</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">선생님 목록을 불러오는 중...</div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? '검색 결과가 없습니다.' : '등록된 선생님이 없습니다.'}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTeachers.map((teacher) => (
                  <Card key={teacher.id} className={teacher.is_admin ? "border-yellow-500 bg-yellow-50" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{teacher.name}</CardTitle>
                        {teacher.is_admin && (
                          <Shield className="h-4 w-4 text-yellow-600" title="관리자" />
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        {teacher.email}
                        {teacher.phone && <><br />{teacher.phone}</>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">가입일</span>
                        <span className="font-medium">
                          {new Date(teacher.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      {teacher.is_admin && (
                        <div className="text-sm text-yellow-700 font-medium">
                          관리자 권한 보유
                        </div>
                      )}
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
