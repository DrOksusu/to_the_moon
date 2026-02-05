import { Star, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Feedback {
  id: number
  lesson_id: number
  teacher_name: string
  content: string
  rating?: number
  created_at: Date
}

interface RecentFeedbackProps {
  feedback: Feedback[]
}

export function RecentFeedback({ feedback }: RecentFeedbackProps) {
  if (feedback.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No feedback yet. Complete lessons to receive feedback from your teacher.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => {
        const date = new Date(item.created_at)
        return (
          <div
            key={item.id}
            className="p-4 rounded-lg border space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{item.teacher_name}</span>
              </div>
              {item.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{item.rating}/5</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.content}
            </p>
            <div className="text-xs text-muted-foreground">
              {date.toLocaleDateString()}
            </div>
          </div>
        )
      })}
    </div>
  )
}
