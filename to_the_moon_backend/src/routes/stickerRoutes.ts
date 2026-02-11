import { Router } from 'express';
import {
  createSticker,
  getStickers,
  getStickerStats,
  updateSticker,
  deleteSticker,
  getStickerLevels,
} from '../controllers/stickerController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// 스티커 레벨 목록 (인증 불필요)
router.get('/levels', getStickerLevels);

// 이하 인증 필요
router.use(authenticate);

// 스티커 통계 (:id 라우트보다 먼저 정의)
router.get('/stats', getStickerStats);

// 스티커 목록 조회
router.get('/', getStickers);

// 스티커 발행 (선생님 전용)
router.post('/', createSticker);

// 스티커 수정 (선생님 전용)
router.patch('/:id', updateSticker);

// 스티커 삭제 (선생님 전용)
router.delete('/:id', deleteSticker);

export default router;
