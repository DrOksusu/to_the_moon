'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { StudentNav } from '@/components/student/student-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trophy, Calendar, BookOpen, Target, Youtube, MessageCircle, Check } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const REACTION_EMOJIS = ['👍', '😊', '🔥', '💪', '🙏'] as const

interface Feedback {
  id: string
  rating: number
  content: string
  strengths: string | null
  improvements: string | null
  homework: string | null
  reference_urls: string | null
  student_reaction: string | null
  student_message: string | null
  student_reacted_at: string | null
  created_at: string
  lessons: {
    id: string
    title: string | null
    scheduled_at: string
  }
  users_feedbacks_teacher_idTousers: {
    id: string
    name: string
  }
  users_feedbacks_student_idTousers: {
    id: string
    name: string
  }
}

// 유튜브 URL에서 비디오 ID 추출
function getYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// URL이 유튜브인지 확인
function isYoutubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

export default function StudentFeedback() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reactionState, setReactionState] = useState<{
    [feedbackId: string]: {
      selectedEmoji: string | null
      message: string
      isSubmitting: boolean
      showInput: boolean
    }
  }>({})

  // 반응 선택 처리
  const handleEmojiSelect = (feedbackId: string, emoji: string) => {
    setReactionState(prev => ({
      ...prev,
      [feedbackId]: {
        ...prev[feedbackId],
        selectedEmoji: emoji,
        message: prev[feedbackId]?.message || '',
        isSubmitting: false,
        showInput: true,
      }
    }))
  }

  // 메시지 변경 처리
  const handleMessageChange = (feedbackId: string, message: string) => {
    if (message.length <= 100) {
      setReactionState(prev => ({
        ...prev,
        [feedbackId]: {
          ...prev[feedbackId],
          message,
        }
      }))
    }
  }

  // 반응 제출
  const submitReaction = async (feedbackId: string) => {
    const state = reactionState[feedbackId]
    if (!state?.selectedEmoji) return

    setReactionState(prev => ({
      ...prev,
      [feedbackId]: { ...prev[feedbackId], isSubmitting: true }
    }))

    try {
      await api.patch(`/feedback/${feedbackId}/reaction`, {
        reaction: state.selectedEmoji,
        message: state.message || undefined,
      })

      // 로컬 상태 업데이트
      setFeedbacks(prev => prev.map(f =>
        f.id === feedbackId
          ? {
              ...f,
              student_reaction: state.selectedEmoji,
              student_message: state.message || null,
              student_reacted_at: new Date().toISOString()
            }
          : f
      ))

      // 반응 상태 초기화
      setReactionState(prev => ({
        ...prev,
        [feedbackId]: {
          selectedEmoji: null,
          message: '',
          isSubmitting: false,
          showInput: false,
        }
      }))

      toast({
        title: '감사 인사 전송 완료',
        description: '선생님께 반응이 전달되었습니다.',
      })
    } catch (error) {
      console.error('Error submitting reaction:', error)
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '반응 전송에 실패했습니다.',
        variant: 'destructive',
      })
      setReactionState(prev => ({
        ...prev,
        [feedbackId]: { ...prev[feedbackId], isSubmitting: false }
      }))
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && user.role !== 'student') {
      router.push('/teacher/dashboard')
      return
    }

    if (user) {
      fetchFeedbacks()
    }
  }, [user, loading, router])

  // 해시로 스크롤
  useEffect(() => {
    if (!isLoading && feedbacks.length > 0) {
      const hash = window.location.hash
      if (hash) {
        const element = document.querySelector(hash)
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
      }
    }
  }, [isLoading, feedbacks])

  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true)
      const data = await api.get<Feedback[]>('/feedback')
      setFeedbacks(data)
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <StudentNav />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  const averageRating = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
    : 0

  return (
    <div className="min-h-screen bg-background">
      <StudentNav />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">받은 피드백</h1>
          <p className="text-muted-foreground mt-2">
            전체 {feedbacks.length}개의 피드백
          </p>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                평균 평점
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground mt-1">5점 만점</p>
              <div className="flex items-center gap-1 mt-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Trophy
                    key={i}
                    className={`h-6 w-6 ${
                      i < Math.round(averageRating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                총 피드백 수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{feedbacks.length}</div>
              <p className="text-sm text-muted-foreground mt-1">
                받은 피드백
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feedbacks List */}
        {feedbacks.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                아직 받은 피드백이 없습니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {feedbacks.map((feedback) => (
              <Card key={feedback.id} id={`feedback-${feedback.id}`} className="hover:shadow-md transition-shadow scroll-mt-4">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Link
                          href={`/student/lessons/${feedback.lessons.id}`}
                          className="hover:underline"
                        >
                          {feedback.lessons.title || '레슨'}
                        </Link>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {feedback.users_feedbacks_teacher_idTousers.name} 선생님 ·{' '}
                        {new Date(feedback.created_at).toLocaleDateString('ko-KR')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Trophy
                          key={i}
                          className={`h-5 w-5 ${
                            i < feedback.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">전체 피드백</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {feedback.content}
                    </p>
                  </div>

                  {feedback.strengths && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-medium">잘한 점</p>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {feedback.strengths}
                      </p>
                    </div>
                  )}

                  {feedback.improvements && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-medium">개선할 점</p>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {feedback.improvements}
                      </p>
                    </div>
                  )}

                  {feedback.homework && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-purple-600" />
                        <p className="text-sm font-medium">과제</p>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {feedback.homework}
                      </p>
                    </div>
                  )}

                  {feedback.reference_urls && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Youtube className="h-4 w-4 text-red-600" />
                        <p className="text-sm font-medium">참고 영상</p>
                      </div>
                      <div className="space-y-4">
                        {feedback.reference_urls.split('\n').filter(url => url.trim()).map((url, index) => {
                          const videoId = isYoutubeUrl(url) ? getYoutubeVideoId(url) : null
                          return (
                            <div key={index} className="space-y-2">
                              {videoId ? (
                                <div className="aspect-video w-full rounded-lg overflow-hidden border">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={`YouTube video ${index + 1}`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                  />
                                </div>
                              ) : (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline break-all"
                                >
                                  {url}
                                </a>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      레슨 일시:{' '}
                      {new Date(feedback.lessons.scheduled_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* 학생 반응 섹션 */}
                  <div className="pt-4 border-t mt-4">
                    {feedback.student_reaction ? (
                      // 이미 반응한 경우
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>선생님께 감사 인사를 보냈습니다</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{feedback.student_reaction}</span>
                          {feedback.student_message && (
                            <div className="flex items-center gap-2 text-sm">
                              <MessageCircle className="h-4 w-4 text-muted-foreground" />
                              <span>{feedback.student_message}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // 아직 반응하지 않은 경우
                      <div className="space-y-3">
                        <p className="text-sm font-medium">이 피드백이 도움이 되었나요?</p>
                        <div className="flex gap-2">
                          {REACTION_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleEmojiSelect(feedback.id, emoji)}
                              className={`text-2xl p-2 rounded-lg transition-all hover:bg-muted ${
                                reactionState[feedback.id]?.selectedEmoji === emoji
                                  ? 'bg-primary/10 ring-2 ring-primary'
                                  : ''
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        {reactionState[feedback.id]?.showInput && (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <div className="flex gap-2">
                              <Input
                                placeholder="선생님께 한마디... (선택)"
                                value={reactionState[feedback.id]?.message || ''}
                                onChange={(e) => handleMessageChange(feedback.id, e.target.value)}
                                maxLength={100}
                                className="flex-1"
                              />
                              <Button
                                onClick={() => submitReaction(feedback.id)}
                                disabled={reactionState[feedback.id]?.isSubmitting}
                                size="sm"
                              >
                                {reactionState[feedback.id]?.isSubmitting ? '전송 중...' : '보내기'}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground text-right">
                              {reactionState[feedback.id]?.message?.length || 0}/100
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
