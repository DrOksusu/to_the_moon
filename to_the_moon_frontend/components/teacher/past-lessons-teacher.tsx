import { Calendar, Clock, CheckCircle, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Lesson {
  id: number
  student_id: number
  student_name: string
  scheduled_at: Date
  duration: number
  title?: string
  status: string
}

interface PastLessonsTeacherProps {
  lessons: Lesson[]
}

export function PastLessonsTeacher({ lessons }: PastLessonsTeacherProps) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No past lessons yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {lessons.map((lesson) => {
        const date = new Date(lesson.scheduled_at)
        return (
          <div
            key={lesson.id}
            className="p-4 rounded-lg border bg-muted/30"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{lesson.title || 'Vocal Lesson'}</div>
                  {lesson.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  {lesson.student_name}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {date.toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <Badge variant="secondary">{lesson.duration} min</Badge>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/teacher/lessons/${lesson.id}/feedback`}>
                  Add Feedback
                </Link>
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
