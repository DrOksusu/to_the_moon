'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { TeacherNav } from '@/components/teacher/teacher-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function NewAnnouncementPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'teacher')) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      await api.post('/announcements', { title, content })
      toast({
        title: '공지 등록 완료',
        description: '공지사항이 학생들에게 전송되었습니다.',
      })
      router.push('/teacher/announcements')
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '공지사항 등록에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading || !user) {
    return <div>로딩중...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav />
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teacher/announcements">
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>새 공지사항 작성</CardTitle>
            <CardDescription>
              담당 학생 전체에게 공지사항이 전송됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  placeholder="공지사항 제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">내용</Label>
                <Textarea
                  id="content"
                  placeholder="공지사항 내용을 입력하세요"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={submitting} className="flex-1">
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? '등록 중...' : '공지 등록'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
