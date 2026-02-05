import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Student {
  id: number
  user_id: number
  student_name: string
  student_email: string
  level: string
  voice_type: string
}

interface StudentListProps {
  students: Student[]
}

export function StudentList({ students }: StudentListProps) {
  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No students yet. Add your first student to get started.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {students.map((student) => (
        <Link
          key={student.id}
          href={`/teacher/students/${student.user_id}`}
          className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
        >
          <Avatar>
            <AvatarFallback>
              {student.student_name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium">{student.student_name}</div>
            <div className="text-sm text-muted-foreground">{student.student_email}</div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{student.level}</Badge>
            <Badge variant="outline">{student.voice_type}</Badge>
          </div>
        </Link>
      ))}
    </div>
  )
}
