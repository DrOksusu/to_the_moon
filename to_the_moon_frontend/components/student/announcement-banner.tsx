'use client'

import { useEffect, useState } from 'react'
import { Bell, X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

interface Announcement {
  id: string
  title: string
  content: string
  created_at: string
  teacher: {
    id: string
    name: string
  }
  is_read: boolean
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true)
      const data = await api.get<Announcement[]>('/student/announcements')
      // 읽지 않은 공지만 필터링
      const unread = data.filter((a) => !a.is_read)
      setAnnouncements(unread)
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.post(`/student/announcements/${id}/read`, {})
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      if (currentIndex >= announcements.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1))
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : announcements.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < announcements.length - 1 ? prev + 1 : 0))
  }

  if (isLoading || isDismissed || announcements.length === 0) {
    return null
  }

  const current = announcements[currentIndex]

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 shadow-md">
      <div className="container mx-auto flex items-center justify-between gap-4">
        {/* 왼쪽: 아이콘 + 내용 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 relative">
            <Bell className="h-5 w-5" />
            {announcements.length > 1 && (
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 h-5 min-w-[1.25rem] px-1 text-xs bg-white text-blue-600"
              >
                {announcements.length}
              </Badge>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {current.title}
            </p>
            <p className="text-xs text-blue-100 truncate">
              {current.content}
            </p>
          </div>
        </div>

        {/* 오른쪽: 네비게이션 + 버튼 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {announcements.length > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-blue-400"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs">
                {currentIndex + 1}/{announcements.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-blue-400"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs bg-white text-blue-600 hover:bg-blue-50"
            onClick={() => handleMarkAsRead(current.id)}
          >
            <Check className="h-3 w-3 mr-1" />
            읽음
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-blue-400"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
