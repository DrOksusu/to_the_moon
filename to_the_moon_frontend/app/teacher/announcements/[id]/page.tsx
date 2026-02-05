'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { TeacherNav } from '@/components/teacher/teacher-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, Trash2, Check, X, Users } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface StudentReadStatus {
  id: string
  name: string
  email: string
  has_read: boolean
  read_at?: string
}

interface AnnouncementDetail {
  id: string
  title: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
  students: StudentReadStatus[]
  read_count: number
  total_students: number
}

export default function AnnouncementDetailPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const id = params.id as string

  const [announcement, setAnnouncement] = useState<AnnouncementDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'teacher')) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && user.role === 'teacher' && id) {
      fetchAnnouncement()
    }
  }, [user, id])

  const fetchAnnouncement = async () => {
    try {
      setLoading(true)
      const data = await api.get<AnnouncementDetail>(`/announcements/${id}`)
      setAnnouncement(data)
      setTitle(data.title)
      setContent(data.content)
      setIsActive(data.is_active)
    } catch (error) {
      console.error('Failed to fetch announcement:', error)
      toast({
        title: '오류',
        description: '공지사항을 불러올 수 없습니다.',
        variant: 'destructive',
      })
      router.push('/teacher/announcements')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: '입력 오류',
        description: '제목과 내용을 모두 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)
      await api.put(`/announcements/${id}`, { title, content, is_active: isActive })
      toast({
        title: '수정 완료',
        description: '공지사항이 수정되었습니다.',
      })
      setIsEditing(false)
      fetchAnnouncement()
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '공지사항 수정에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) return

    try {
      await api.delete(`/announcements/${id}`)
      toast({
        title: '삭제 완료',
        description: '공지사항이 삭제되었습니다.',
      })
      router.push('/teacher/announcements')
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '공지사항 삭제에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = () => {
    if (announcement) {
      setTitle(announcement.title)
      setContent(announcement.content)
      setIsActive(announcement.is_active)
    }
    setIsEditing(false)
  }

  if (isLoading || !user) {
    return <div>로딩중...</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TeacherNav />
        <div className="container mx-auto p-6">
          <div className="text-center py-12">공지사항을 불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (!announcement) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav />
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teacher/announcements">
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {/* 공지 내용 */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>공지사항 {isEditing ? '수정' : '상세'}</CardTitle>
                  <CardDescription>
                    작성일: {new Date(announcement.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </CardDescription>
                </div>
                {!isEditing && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      수정
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="title">제목</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={255}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">내용</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="is_active"
                        checked={isActive}
                        onCheckedChange={(checked) => setIsActive(checked === true)}
                      />
                      <Label htmlFor="is_active">활성화 (학생에게 표시)</Label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={submitting} className="flex-1">
                      <Save className="mr-2 h-4 w-4" />
                      {submitting ? '저장 중...' : '저장'}
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      취소
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-semibold">{announcement.title}</h2>
                      {!announcement.is_active && (
                        <Badge variant="secondary">비활성</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 읽음 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                읽음 현황
              </CardTitle>
              <CardDescription>
                {announcement.read_count}/{announcement.total_students}명이 읽었습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {announcement.students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  담당 학생이 없습니다.
                </p>
              ) : (
                <div className="space-y-2">
                  {announcement.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            student.has_read
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {student.has_read ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      {student.has_read && student.read_at && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(student.read_at).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
