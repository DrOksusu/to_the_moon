import { Request, Response } from 'express';
import prisma from '../config/database';
import { randomUUID } from 'crypto';
import { createNotification } from './notificationController';

/**
 * 선생님 공지 목록 조회 (읽음 통계 포함)
 * GET /api/announcements
 */
export const getAnnouncements = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'teacher') {
      res.status(403).json({ error: 'Teachers only' });
      return;
    }

    const teacherId = req.user.userId;

    // 담당 학생 수 조회
    const totalStudents = await prisma.student_profiles.count({
      where: {
        teacher_id: teacherId,
        is_active: true,
      },
    });

    const announcements = await prisma.announcements.findMany({
      where: {
        teacher_id: teacherId,
      },
      include: {
        _count: {
          select: {
            announcement_reads: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const result = announcements.map((announcement) => ({
      ...announcement,
      read_count: announcement._count.announcement_reads,
      total_students: totalStudents,
      _count: undefined,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to get announcements' });
  }
};

/**
 * 공지 상세 조회 + 읽은 학생 목록
 * GET /api/announcements/:id
 */
export const getAnnouncement = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'teacher') {
      res.status(403).json({ error: 'Teachers only' });
      return;
    }

    const { id } = req.params;
    const teacherId = req.user.userId;

    const announcement = await prisma.announcements.findFirst({
      where: {
        id,
        teacher_id: teacherId,
      },
      include: {
        announcement_reads: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            read_at: 'desc',
          },
        },
      },
    });

    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }

    // 담당 학생 전체 목록 조회
    const allStudents = await prisma.student_profiles.findMany({
      where: {
        teacher_id: teacherId,
        is_active: true,
      },
      include: {
        users_student_profiles_user_idTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const readStudentIds = new Set(
      announcement.announcement_reads.map((r) => r.student_id)
    );

    const students = allStudents.map((sp) => ({
      id: sp.users_student_profiles_user_idTousers.id,
      name: sp.users_student_profiles_user_idTousers.name,
      email: sp.users_student_profiles_user_idTousers.email,
      has_read: readStudentIds.has(sp.users_student_profiles_user_idTousers.id),
      read_at: announcement.announcement_reads.find(
        (r) => r.student_id === sp.users_student_profiles_user_idTousers.id
      )?.read_at,
    }));

    res.json({
      ...announcement,
      students,
      read_count: announcement.announcement_reads.length,
      total_students: allStudents.length,
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ error: 'Failed to get announcement' });
  }
};

/**
 * 공지 작성 + 알림 발송
 * POST /api/announcements
 */
export const createAnnouncement = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'teacher') {
      res.status(403).json({ error: 'Teachers only' });
      return;
    }

    const teacherId = req.user.userId;
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    const announcement = await prisma.announcements.create({
      data: {
        id: randomUUID(),
        teacher_id: teacherId,
        title,
        content,
        updated_at: new Date(),
      },
    });

    // 담당 학생들에게 알림 발송
    const students = await prisma.student_profiles.findMany({
      where: {
        teacher_id: teacherId,
        is_active: true,
      },
      select: {
        user_id: true,
      },
    });

    // 각 학생에게 알림 생성
    for (const student of students) {
      await createNotification(
        student.user_id,
        'feedback_received', // 기존 타입 재사용 (announcement 타입 추가 필요시 별도 마이그레이션)
        '새 공지사항',
        `선생님이 새 공지사항을 등록했습니다: ${title}`
      );
    }

    res.status(201).json(announcement);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

/**
 * 공지 수정
 * PUT /api/announcements/:id
 */
export const updateAnnouncement = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'teacher') {
      res.status(403).json({ error: 'Teachers only' });
      return;
    }

    const { id } = req.params;
    const teacherId = req.user.userId;
    const { title, content, is_active } = req.body;

    const announcement = await prisma.announcements.findFirst({
      where: {
        id,
        teacher_id: teacherId,
      },
    });

    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }

    const updated = await prisma.announcements.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
};

/**
 * 공지 삭제
 * DELETE /api/announcements/:id
 */
export const deleteAnnouncement = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'teacher') {
      res.status(403).json({ error: 'Teachers only' });
      return;
    }

    const { id } = req.params;
    const teacherId = req.user.userId;

    const announcement = await prisma.announcements.findFirst({
      where: {
        id,
        teacher_id: teacherId,
      },
    });

    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }

    await prisma.announcements.delete({
      where: { id },
    });

    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

/**
 * 학생용 공지 목록 조회
 * GET /api/student/announcements
 */
export const getStudentAnnouncements = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'student') {
      res.status(403).json({ error: 'Students only' });
      return;
    }

    const studentId = req.user.userId;

    // 학생의 선생님 ID 조회
    const profile = await prisma.student_profiles.findFirst({
      where: {
        user_id: studentId,
        is_active: true,
      },
    });

    if (!profile) {
      res.status(404).json({ error: 'Student profile not found' });
      return;
    }

    const announcements = await prisma.announcements.findMany({
      where: {
        teacher_id: profile.teacher_id,
        is_active: true,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        announcement_reads: {
          where: {
            student_id: studentId,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const result = announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      created_at: announcement.created_at,
      teacher: announcement.teacher,
      is_read: announcement.announcement_reads.length > 0,
      read_at: announcement.announcement_reads[0]?.read_at,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get student announcements error:', error);
    res.status(500).json({ error: 'Failed to get announcements' });
  }
};

/**
 * 읽지 않은 공지 수 조회
 * GET /api/student/announcements/unread-count
 */
export const getUnreadCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'student') {
      res.status(403).json({ error: 'Students only' });
      return;
    }

    const studentId = req.user.userId;

    // 학생의 선생님 ID 조회
    const profile = await prisma.student_profiles.findFirst({
      where: {
        user_id: studentId,
        is_active: true,
      },
    });

    if (!profile) {
      res.json({ count: 0 });
      return;
    }

    // 선생님의 활성 공지 중 읽지 않은 것 카운트
    const totalAnnouncements = await prisma.announcements.count({
      where: {
        teacher_id: profile.teacher_id,
        is_active: true,
      },
    });

    const readAnnouncements = await prisma.announcement_reads.count({
      where: {
        student_id: studentId,
        announcement: {
          teacher_id: profile.teacher_id,
          is_active: true,
        },
      },
    });

    res.json({ count: totalAnnouncements - readAnnouncements });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

/**
 * 공지 읽음 처리
 * POST /api/student/announcements/:id/read
 */
export const markAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'student') {
      res.status(403).json({ error: 'Students only' });
      return;
    }

    const { id } = req.params;
    const studentId = req.user.userId;

    // 학생의 선생님 ID 조회
    const profile = await prisma.student_profiles.findFirst({
      where: {
        user_id: studentId,
        is_active: true,
      },
    });

    if (!profile) {
      res.status(404).json({ error: 'Student profile not found' });
      return;
    }

    // 공지가 해당 선생님의 것인지 확인
    const announcement = await prisma.announcements.findFirst({
      where: {
        id,
        teacher_id: profile.teacher_id,
        is_active: true,
      },
    });

    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }

    // 이미 읽은 경우 무시 (upsert 대신 findFirst + create)
    const existingRead = await prisma.announcement_reads.findFirst({
      where: {
        announcement_id: id,
        student_id: studentId,
      },
    });

    if (!existingRead) {
      await prisma.announcement_reads.create({
        data: {
          id: randomUUID(),
          announcement_id: id,
          student_id: studentId,
        },
      });
    }

    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};
