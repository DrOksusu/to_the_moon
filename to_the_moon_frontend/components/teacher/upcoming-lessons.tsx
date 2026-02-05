import { Calendar, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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

interface UpcomingLessonsProps {
  lessons: Lesson[]
}

export function UpcomingLessons({ lessons }: UpcomingLessonsProps) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No upcoming lessons scheduled.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {lessons.map((lesson) => {
        const date = new Date(lesson.scheduled_at)
        return (
          <Link
            key={lesson.id}
            href={`/teacher/lessons/${lesson.id}`}
            className="block p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-medium">{lesson.title || 'Vocal Lesson'}</div>
                <div className="text-sm text-muted-foreground">
                  with {lesson.student_name}
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
                </div>
              </div>
              <Badge>{lesson.duration} min</Badge>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
