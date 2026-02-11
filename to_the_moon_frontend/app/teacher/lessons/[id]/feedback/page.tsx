'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TeacherNav } from '@/components/teacher/teacher-nav'
import { Star, Calendar, Clock, Youtube, Plus, X, MessageCircle, Heart, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface StickerMeta {
  level: string
  order: number
  name: string
  emoji: string
  points: number
}

const STICKER_LEVELS: StickerMeta[] = [
  { level: 'seed', order: 1, name: '씨앗', emoji: '🌱', points: 10 },
  { level: 'bloom', order: 2, name: '꽃봉오리', emoji: '🌸', points: 20 },
  { level: 'shooting_star', order: 3, name: '별똥별', emoji: '🌠', points: 30 },
  { level: 'rocket', order: 4, name: '로켓', emoji: '🚀', points: 50 },
  { level: 'satellite', order: 5, name: '위성', emoji: '🛰️', points: 70 },
  { level: 'aurora', order: 6, name: '오로라', emoji: '🌌', points: 85 },
  { level: 'to_the_moon', order: 7, name: '투더문', emoji: '🌕', points: 100 },
]

interface Lesson {
  id: string
  teacher_id: string
  student_id: string
  title?: string
  scheduled_at: string
  duration: number
  status: string
  location?: string
  notes?: string
  student?: {
    id: string
    name: string
    email: string
  }
}

interface Feedback {
  id: string
  lesson_id: string
  rating: number
  content: string
  strengths?: string
  improvements?: string
  homework?: string
  reference_urls?: string
  student_reaction?: string
  student_message?: string
  student_reacted_at?: string
  created_at: string
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

export default function AddFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [existingFeedback, setExistingFeedback] = useState<Feedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rating, setRating] = useState<string>('5')
  const [referenceUrls, setReferenceUrls] = useState<string[]>([''])
  const [newUrl, setNewUrl] = useState('')
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null)
  const [stickerComment, setStickerComment] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // Fetch lesson details
        const lessonData = await api.get<Lesson>(`/lessons/${resolvedParams.id}`)
        setLesson(lessonData)

        // Try to fetch existing feedback
        try {
          const feedbackData = await api.get<Feedback>(`/lessons/${resolvedParams.id}/feedback`)
          setExistingFeedback(feedbackData)
          if (feedbackData.rating) {
            setRating(feedbackData.rating.toString())
          }
          if (feedbackData.reference_urls) {
            const urls = feedbackData.reference_urls.split('\n').filter(url => url.trim())
            setReferenceUrls(urls.length > 0 ? urls : [''])
          }
        } catch (error) {
          // No existing feedback, that's okay
          console.log('No existing feedback')
        }
      } catch (error) {
        console.error('Failed to fetch lesson:', error)
        toast({
          title: '오류',
          description: '레슨 정보를 불러오지 못했습니다',
          variant: 'destructive',
        })
        router.push('/teacher/lessons')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id, router, toast])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    // 빈 URL 제외하고 저장
    const validUrls = referenceUrls.filter(url => url.trim())

    const feedbackData = {
      lesson_id: resolvedParams.id,
      student_id: lesson?.student_id,
      rating: parseInt(rating),
      content: formData.get('content') as string,
      strengths: formData.get('strengths') as string,
      improvements: formData.get('improvements') as string,
      homework: formData.get('homework') as string,
      reference_urls: validUrls.join('\n'),
    }

    try {
      if (existingFeedback) {
        await api.put(`/feedback/${existingFeedback.id}`, feedbackData)
      } else {
        await api.post('/feedback', feedbackData)
      }

      // 스티커 발행
      if (selectedSticker && lesson?.student_id) {
        try {
          await api.post('/stickers', {
            student_id: lesson.student_id,
            level: selectedSticker,
            comment: stickerComment || null,
            lesson_id: resolvedParams.id,
          })
          const stickerMeta = STICKER_LEVELS.find(s => s.level === selectedSticker)
          toast({
            title: '성공',
            description: `피드백이 ${existingFeedback ? '수정' : '등록'}되었습니다. ${stickerMeta?.emoji} ${stickerMeta?.name} 스티커도 발행했습니다!`,
          })
        } catch (stickerError) {
          console.error('Sticker creation failed:', stickerError)
          toast({
            title: '부분 성공',
            description: `피드백은 ${existingFeedback ? '수정' : '등록'}되었지만, 스티커 발행에 실패했습니다.`,
            variant: 'destructive',
          })
        }
      } else {
        toast({
          title: '성공',
          description: `피드백이 ${existingFeedback ? '수정' : '등록'}되었습니다`,
        })
      }

      // 대시보드로 이동 (강제 새로고침)
      window.location.href = '/teacher/dashboard'
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '피드백 등록에 실패했습니다',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TeacherNav />
        <div className="container mx-auto p-6">
          <div className="text-center">레슨 정보를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background">
        <TeacherNav />
        <div className="container mx-auto p-6">
          <div className="text-center">레슨을 찾을 수 없습니다</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav />

      <main className="container mx-auto p-6 max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>
                {existingFeedback ? '피드백 수정' : '피드백 작성'}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {lesson.student?.name && `${lesson.student.name} - `}
                {lesson.title || '보컬 레슨'}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(lesson.scheduled_at).toLocaleDateString('ko-KR')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lesson.duration}분
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="rating">전체 평가</Label>
                <Select
                  name="rating"
                  value={rating}
                  onValueChange={setRating}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="평가를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        5 - 매우 우수
                      </div>
                    </SelectItem>
                    <SelectItem value="4">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        4 - 우수
                      </div>
                    </SelectItem>
                    <SelectItem value="3">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        3 - 보통
                      </div>
                    </SelectItem>
                    <SelectItem value="2">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        2 - 개선 필요
                      </div>
                    </SelectItem>
                    <SelectItem value="1">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        1 - 미흡
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">레슨 피드백</Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="레슨에 대한 전반적인 피드백을 작성해주세요..."
                  rows={5}
                  required
                  defaultValue={existingFeedback?.content}
                />
                <p className="text-sm text-muted-foreground">
                  레슨에 대한 종합적인 요약을 제공하세요
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strengths" className="text-green-600">
                  강점
                </Label>
                <Textarea
                  id="strengths"
                  name="strengths"
                  placeholder="학생이 잘한 점은 무엇인가요?"
                  rows={3}
                  defaultValue={existingFeedback?.strengths}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="improvements" className="text-orange-600">
                  개선 사항
                </Label>
                <Textarea
                  id="improvements"
                  name="improvements"
                  placeholder="학생이 개선해야 할 점은 무엇인가요?"
                  rows={3}
                  defaultValue={existingFeedback?.improvements}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="homework" className="text-blue-600">
                  과제 / 연습 사항
                </Label>
                <Textarea
                  id="homework"
                  name="homework"
                  placeholder="다음 레슨까지 학생이 연습해야 할 내용은?"
                  rows={4}
                  defaultValue={existingFeedback?.homework}
                />
              </div>

              {/* 스티커 발행 섹션 */}
              <div className="space-y-4">
                <Label className="text-amber-600 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  레벨 스티커 발행
                </Label>
                <p className="text-sm text-muted-foreground">
                  오늘 레슨에 대해 학생에게 스티커를 줄 수 있어요 (선택)
                </p>

                {/* 스티커 레벨 선택 */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {STICKER_LEVELS.map((sticker) => (
                    <button
                      key={sticker.level}
                      type="button"
                      onClick={() =>
                        setSelectedSticker(
                          selectedSticker === sticker.level ? null : sticker.level
                        )
                      }
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        selectedSticker === sticker.level
                          ? 'border-amber-400 bg-amber-50 shadow-md scale-105'
                          : 'border-muted hover:border-amber-200 hover:bg-amber-50/50'
                      }`}
                    >
                      <span className="text-2xl">{sticker.emoji}</span>
                      <span className="text-[10px] font-medium leading-tight text-center">
                        {sticker.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* 선택된 스티커 코멘트 입력 */}
                {selectedSticker && (
                  <div className="space-y-2 p-4 rounded-lg bg-amber-50/50 border border-amber-200">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                      <span className="text-lg">
                        {STICKER_LEVELS.find(s => s.level === selectedSticker)?.emoji}
                      </span>
                      {STICKER_LEVELS.find(s => s.level === selectedSticker)?.name} 스티커 선택됨
                    </div>
                    <Input
                      value={stickerComment}
                      onChange={(e) => setStickerComment(e.target.value)}
                      placeholder="한줄 코멘트 (선택) - 예: 오늘 고음 완벽했어!"
                      maxLength={200}
                      className="bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-purple-600 flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  참고 URL
                </Label>
                <p className="text-sm text-muted-foreground">
                  유튜브 링크를 추가하면 학생이 바로 시청할 수 있습니다
                </p>

                {/* URL 입력 필드들 */}
                <div className="space-y-3">
                  {referenceUrls.map((url, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={url}
                          onChange={(e) => {
                            const newUrls = [...referenceUrls]
                            newUrls[index] = e.target.value
                            setReferenceUrls(newUrls)
                          }}
                          placeholder="https://youtube.com/watch?v=..."
                          className="flex-1"
                        />
                        {referenceUrls.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setReferenceUrls(referenceUrls.filter((_, i) => i !== index))
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* 유튜브 미리보기 */}
                      {url && isYoutubeUrl(url) && getYoutubeVideoId(url) && (
                        <div className="aspect-video w-full max-w-md rounded-lg overflow-hidden border">
                          <iframe
                            src={`https://www.youtube.com/embed/${getYoutubeVideoId(url)}`}
                            title="YouTube video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* URL 추가 버튼 */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReferenceUrls([...referenceUrls, ''])}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  URL 추가
                </Button>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? '저장 중...' : existingFeedback ? '피드백 수정' : '피드백 제출'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {existingFeedback && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">이전 제출 정보</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              마지막 수정: {new Date(existingFeedback.created_at).toLocaleString('ko-KR')}
            </CardContent>
          </Card>
        )}

        {/* 학생 반응 표시 */}
        {existingFeedback?.student_reaction && (
          <Card className="border-pink-200 bg-pink-50/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                학생의 반응
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <span className="text-3xl">{existingFeedback.student_reaction}</span>
                <div className="flex-1">
                  {existingFeedback.student_message && (
                    <div className="flex items-start gap-2 mb-2">
                      <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{existingFeedback.student_message}</p>
                    </div>
                  )}
                  {existingFeedback.student_reacted_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(existingFeedback.student_reacted_at).toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
