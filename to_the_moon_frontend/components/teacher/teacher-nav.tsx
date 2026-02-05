'use client'

import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Calendar, LogOut, Shield, Home, Heart, Megaphone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { NotificationBell } from '@/components/notifications/notification-bell'

export function TeacherNav() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [newReactionCount, setNewReactionCount] = useState(0)

  useEffect(() => {
    const fetchReactionCount = async () => {
      if (!user || user.role !== 'teacher') return
      try {
        const data = await api.get<{ count: number }>('/feedback/unviewed-reactions-count')
        setNewReactionCount(data.count)
      } catch (error) {
        console.error('Failed to fetch reaction count:', error)
      }
    }
    fetchReactionCount()

    // 30초마다 갱신
    const interval = setInterval(fetchReactionCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (!user) return null

  return (
    <TooltipProvider>
      <nav className="border-b bg-card">
        <div className="flex items-center justify-between px-4 py-2">
          {/* 왼쪽: 로고 + 메뉴 */}
          <div className="flex items-center gap-3">
            <Link href="/teacher/dashboard">
              <Image
                src="/to_the_moon_logo3.jpg"
                alt="To The MOON"
                width={36}
                height={36}
              />
            </Link>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/teacher/dashboard">
                    <Home className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>대시보드</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/teacher/students">
                    <Users className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>학생 관리</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/teacher/lessons">
                    <Calendar className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>레슨 관리</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/teacher/announcements">
                    <Megaphone className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>공지사항</p>
              </TooltipContent>
            </Tooltip>

            {/* 학생 반응 알림 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild className="relative">
                  <Link href="/teacher/dashboard#reactions">
                    <Heart className="h-5 w-5" />
                    {newReactionCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
                        {newReactionCount > 9 ? '9+' : newReactionCount}
                      </span>
                    )}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>학생 반응 {newReactionCount > 0 && `(${newReactionCount})`}</p>
              </TooltipContent>
            </Tooltip>

            {/* 알림 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <NotificationBell />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>알림</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* 오른쪽: 관리자 + 로그아웃 */}
          <div className="flex items-center gap-2">
            {user.is_admin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/dashboard">
                      <Shield className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>관리자 모드</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>로그아웃</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}
