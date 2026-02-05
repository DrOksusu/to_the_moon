'use client'

import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MessageSquare, User, LogOut, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { NotificationBell } from '@/components/notifications/notification-bell'

export function StudentNav() {
  const { user, logout } = useAuth()
  const router = useRouter()

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
            <Link href="/student/dashboard">
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
                  <Link href="/student/dashboard">
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
                  <Link href="/student/lessons">
                    <Calendar className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>레슨 일정</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/student/feedback">
                    <MessageSquare className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>피드백</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/student/profile">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>프로필</p>
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

          {/* 오른쪽: 로그아웃 */}
          <div className="flex items-center gap-2">
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
