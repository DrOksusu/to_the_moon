import { Calendar, Clock, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Lesson {
  id: number
  teacher_name: string
  scheduled_at: Date
  duration: number
  title?: string
  location?: string
  status: string
}

interface UpcomingLessonsStudentProps {
  lessons: Lesson[]
}

export function UpcomingLessonsStudent({ lessons }: UpcomingLessonsStudentProps) {
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
          <div
            key={lesson.id}
            className="p-4 rounded-lg border"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-medium">{lesson.title || 'Vocal Lesson'}</div>
                <div className="text-sm text-muted-foreground">
                  with {lesson.teacher_name}
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
                {lesson.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {lesson.location}
                  </div>
                )}
              </div>
              <Badge>{lesson.duration} min</Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}
