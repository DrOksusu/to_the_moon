// Mock data for frontend preview

export interface User {
  id: string
  email: string
  name: string
  role: 'teacher' | 'student'
  avatar?: string
  is_admin?: boolean
}

export interface StudentProfile {
  id: string
  userId: string
  teacherId: string
  voiceType: string
  level: string
  startDate: string
  goals?: string
  user: User
}

export interface Lesson {
  id: string
  teacherId: string
  studentId: string
  scheduledAt: string
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled'
  location?: string
  notes?: string
  student: User
}

export interface Feedback {
  id: string
  lessonId: string
  teacherId: string
  studentId: string
  rating: number
  content: string
  strengths?: string
  improvements?: string
  homework?: string
  createdAt: string
  teacher: User
  lesson: Lesson
}

export interface File {
  id: string
  uploaderId: string
  studentId: string | null
  fileType: string
  fileName: string
  fileSize: number
  uploadedAt: string
  uploader: User
}

// Mock current user
export const mockCurrentUser: User = {
  id: '1',
  email: 'teacher@vocalstudio.com',
  name: '김선생',
  role: 'teacher',
}

export const mockStudentUser: User = {
  id: '2',
  email: 'student@vocalstudio.com',
  name: '이학생',
  role: 'student',
}

// Mock students
export const mockStudents: StudentProfile[] = [
  {
    id: '1',
    userId: '2',
    teacherId: '1',
    voiceType: 'Soprano',
    level: 'Intermediate',
    startDate: '2024-01-15',
    goals: '클래식 성악 마스터하기',
    user: {
      id: '2',
      email: 'student1@example.com',
      name: '이민지',
      role: 'student',
    }
  },
  {
    id: '2',
    userId: '3',
    teacherId: '1',
    voiceType: 'Tenor',
    level: 'Beginner',
    startDate: '2024-02-20',
    goals: '팝송 부르기',
    user: {
      id: '3',
      email: 'student2@example.com',
      name: '박준호',
      role: 'student',
    }
  },
  {
    id: '3',
    userId: '4',
    teacherId: '1',
    voiceType: 'Alto',
    level: 'Advanced',
    startDate: '2023-11-10',
    goals: '뮤지컬 오디션 준비',
    user: {
      id: '4',
      email: 'student3@example.com',
      name: '최서연',
      role: 'student',
    }
  },
]

// Mock lessons
export const mockLessons: Lesson[] = [
  {
    id: '1',
    teacherId: '1',
    studentId: '2',
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    status: 'scheduled',
    location: '스튜디오 A',
    notes: '발성 연습 집중',
    student: mockStudents[0].user,
  },
  {
    id: '2',
    teacherId: '1',
    studentId: '3',
    scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 45,
    status: 'scheduled',
    location: '스튜디오 B',
    notes: '호흡 훈련',
    student: mockStudents[1].user,
  },
  {
    id: '3',
    teacherId: '1',
    studentId: '4',
    scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    status: 'completed',
    location: '스튜디오 A',
    notes: '오디션 곡 연습',
    student: mockStudents[2].user,
  },
]

// Mock feedback
export const mockFeedback: Feedback[] = [
  {
    id: '1',
    lessonId: '3',
    teacherId: '1',
    studentId: '4',
    rating: 5,
    content: '이번 레슨에서 고음 처리가 매우 향상되었습니다. 호흡 조절이 눈에 띄게 좋아졌어요.',
    strengths: '고음의 안정성, 정확한 음정',
    improvements: '저음역대의 공명 개선 필요',
    homework: '매일 30분 발성 연습, "Defying Gravity" 1절 완벽하게 연습해오기',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    teacher: mockCurrentUser,
    lesson: mockLessons[2],
  },
  {
    id: '2',
    lessonId: '4',
    teacherId: '1',
    studentId: '2',
    rating: 4,
    content: '발성 기초가 잘 다져지고 있습니다. 꾸준한 연습이 필요해요.',
    strengths: '열정적인 태도, 빠른 학습 속도',
    improvements: '리듬감 향상 필요',
    homework: '음계 연습 매일 20분, 메트로놈 사용한 리듬 훈련',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    teacher: mockCurrentUser,
    lesson: {
      ...mockLessons[0],
      id: '4',
      scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
    },
  },
]

// Mock files
export const mockFiles: File[] = [
  {
    id: '1',
    uploaderId: '1',
    studentId: '2',
    fileType: 'audio/mpeg',
    fileName: '발성연습_예시.mp3',
    fileSize: 5242880,
    uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    uploader: mockCurrentUser,
  },
  {
    id: '2',
    uploaderId: '1',
    studentId: null,
    fileType: 'application/pdf',
    fileName: '음계연습_악보.pdf',
    fileSize: 1048576,
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    uploader: mockCurrentUser,
  },
  {
    id: '3',
    uploaderId: '2',
    studentId: '2',
    fileType: 'audio/mpeg',
    fileName: '내_연습_녹음_2024_01_15.mp3',
    fileSize: 8388608,
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    uploader: mockStudents[0].user,
  },
]
