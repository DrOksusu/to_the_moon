import { Request, Response } from 'express';
import prisma from '../config/database';
import { randomUUID } from 'crypto';
import { sticker_level } from '@prisma/client';
import { STICKER_LEVELS, STICKER_LEVELS_LIST, calcTotalPoints } from '../constants/sticker';

/**
 * 스티커 발행 (선생님 전용)
 * POST /api/stickers
 */
export const createSticker = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'teacher') {
      res.status(403).json({ error: '선생님만 스티커를 발행할 수 있습니다.' });
      return;
    }

    const { student_id, level, comment, lesson_id } = req.body;

    if (!student_id || !level) {
      res.status(400).json({ error: 'student_id와 level은 필수입니다.' });
      return;
    }

    // 유효한 스티커 레벨인지 확인
    if (!STICKER_LEVELS[level as sticker_level]) {
      res.status(400).json({
        error: '유효하지 않은 스티커 레벨입니다.',
        validLevels: STICKER_LEVELS_LIST.map((l) => l.level),
      });
      return;
    }

    // 학생이 해당 선생님의 학생인지 확인
    const studentProfile = await prisma.student_profiles.findFirst({
      where: {
        user_id: student_id,
        teacher_id: req.user.userId,
      },
    });

    if (!studentProfile) {
      res.status(404).json({ error: '해당 학생을 찾을 수 없습니다.' });
      return;
    }

    const sticker = await prisma.stickers.create({
      data: {
        id: randomUUID(),
        teacher_id: req.user.userId,
        student_id,
        level: level as sticker_level,
        comment: comment || null,
        lesson_id: lesson_id || null,
      },
      include: {
        student: {
          select: { id: true, name: true },
        },
      },
    });

    const meta = STICKER_LEVELS[level as sticker_level];

    res.status(201).json({
      ...sticker,
      meta,
    });
  } catch (error) {
    console.error('Create sticker error:', error);
    res.status(500).json({ error: '스티커 발행에 실패했습니다.' });
  }
};

/**
 * 학생별 스티커 목록 조회
 * GET /api/stickers?student_id=xxx
 */
export const getStickers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { student_id, lesson_id, limit, offset } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const where: any = {};

    if (userRole === 'teacher') {
      where.teacher_id = userId;
      if (student_id) {
        where.student_id = student_id as string;
      }
    } else {
      // 학생은 본인 스티커만 조회
      where.student_id = userId;
    }

    if (lesson_id) {
      where.lesson_id = lesson_id as string;
    }

    const stickers = await prisma.stickers.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, name: true },
        },
        student: {
          select: { id: true, name: true },
        },
        lesson: {
          select: { id: true, title: true, scheduled_at: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit ? parseInt(limit as string) : 50,
      skip: offset ? parseInt(offset as string) : 0,
    });

    // 메타데이터 포함
    const stickersWithMeta = stickers.map((s) => ({
      ...s,
      meta: STICKER_LEVELS[s.level],
    }));

    res.json(stickersWithMeta);
  } catch (error) {
    console.error('Get stickers error:', error);
    res.status(500).json({ error: '스티커 조회에 실패했습니다.' });
  }
};

/**
 * 학생별 스티커 통계
 * GET /api/stickers/stats?student_id=xxx
 */
export const getStickerStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.userId;
    const userRole = req.user.role;
    const studentId = userRole === 'student' ? userId : (req.query.student_id as string);

    if (!studentId) {
      res.status(400).json({ error: 'student_id가 필요합니다.' });
      return;
    }

    // 레벨별 개수 집계
    const counts = await prisma.stickers.groupBy({
      by: ['level'],
      where: { student_id: studentId },
      _count: { level: true },
    });

    // 레벨별 카운트 맵 생성
    const levelCounts: Partial<Record<sticker_level, number>> = {};
    let totalCount = 0;
    counts.forEach((c) => {
      levelCounts[c.level] = c._count.level;
      totalCount += c._count.level;
    });

    // 총 포인트 계산
    const totalPoints = calcTotalPoints(levelCounts);

    // 최근 받은 스티커
    const latestSticker = await prisma.stickers.findFirst({
      where: { student_id: studentId },
      orderBy: { created_at: 'desc' },
      include: {
        teacher: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({
      totalCount,
      totalPoints,
      levelCounts: STICKER_LEVELS_LIST.map((meta) => ({
        ...meta,
        count: levelCounts[meta.level] || 0,
      })),
      latestSticker: latestSticker
        ? { ...latestSticker, meta: STICKER_LEVELS[latestSticker.level] }
        : null,
    });
  } catch (error) {
    console.error('Get sticker stats error:', error);
    res.status(500).json({ error: '스티커 통계 조회에 실패했습니다.' });
  }
};

/**
 * 스티커 수정 (선생님 전용 - 본인이 발행한 것만)
 * PATCH /api/stickers/:id
 */
export const updateSticker = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'teacher') {
      res.status(403).json({ error: '선생님만 스티커를 수정할 수 있습니다.' });
      return;
    }

    const { id } = req.params;
    const { level, comment } = req.body;

    const sticker = await prisma.stickers.findUnique({
      where: { id },
    });

    if (!sticker) {
      res.status(404).json({ error: '스티커를 찾을 수 없습니다.' });
      return;
    }

    if (sticker.teacher_id !== req.user.userId) {
      res.status(403).json({ error: '본인이 발행한 스티커만 수정할 수 있습니다.' });
      return;
    }

    if (level && !STICKER_LEVELS[level as sticker_level]) {
      res.status(400).json({ error: '유효하지 않은 스티커 레벨입니다.' });
      return;
    }

    const updated = await prisma.stickers.update({
      where: { id },
      data: {
        ...(level && { level: level as sticker_level }),
        ...(comment !== undefined && { comment: comment || null }),
      },
      include: {
        student: {
          select: { id: true, name: true },
        },
      },
    });

    const meta = STICKER_LEVELS[updated.level];

    res.json({ ...updated, meta });
  } catch (error) {
    console.error('Update sticker error:', error);
    res.status(500).json({ error: '스티커 수정에 실패했습니다.' });
  }
};

/**
 * 스티커 삭제 (선생님 전용 - 본인이 발행한 것만)
 * DELETE /api/stickers/:id
 */
export const deleteSticker = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'teacher') {
      res.status(403).json({ error: '선생님만 스티커를 삭제할 수 있습니다.' });
      return;
    }

    const { id } = req.params;

    const sticker = await prisma.stickers.findUnique({
      where: { id },
    });

    if (!sticker) {
      res.status(404).json({ error: '스티커를 찾을 수 없습니다.' });
      return;
    }

    if (sticker.teacher_id !== req.user.userId) {
      res.status(403).json({ error: '본인이 발행한 스티커만 삭제할 수 있습니다.' });
      return;
    }

    await prisma.stickers.delete({ where: { id } });

    res.json({ message: '스티커가 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete sticker error:', error);
    res.status(500).json({ error: '스티커 삭제에 실패했습니다.' });
  }
};

/**
 * 스티커 레벨 목록 (인증 불필요)
 * GET /api/stickers/levels
 */
export const getStickerLevels = async (
  _req: Request,
  res: Response
): Promise<void> => {
  res.json(STICKER_LEVELS_LIST);
};
