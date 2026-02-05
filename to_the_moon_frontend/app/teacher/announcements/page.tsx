'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { TeacherNav } from '@/components/teacher/teacher-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Megaphone, Users, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface Announcement {
  id: string
  title: string
  content: string
  is_active: boolean
  created_at: string
  read_count: number
  total_students: number
}

export default function AnnouncementsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'teacher')) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchAnnouncements()
    }
  }, [user])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const data = await api.get<Announcement[]>('/announcements')
      setAnnouncements(data)
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !user) {
    return <div>로딩중...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Megaphone className="h-8 w-8" />
              공지사항
            </h1>
            <p className="text-muted-foreground">학생들에게 공지사항을 보내세요</p>
          </div>
          <Button asChild>
            <Link href="/teacher/announcements/new">
              <Plus className="mr-2 h-4 w-4" />
              새 공지 작성
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">공지사항을 불러오는 중...</div>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>등록된 공지사항이 없습니다.</p>
                <p className="text-sm mt-1">새 공지를 작성해 학생들에게 알려보세요.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className={!announcement.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {announcement.title}
                        {!announcement.is_active && (
                          <Badge variant="secondary">비활성</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {new Date(announcement.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {announcement.read_count}/{announcement.total_students}
                      </Badge>
                      {announcement.is_active ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {announcement.content}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/teacher/announcements/${announcement.id}`}>
                      상세보기
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
