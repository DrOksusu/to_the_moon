import { Router } from 'express';
import {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getStudentAnnouncements,
  getUnreadCount,
  markAsRead,
} from '../controllers/announcementController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// Teacher routes
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncement);
router.post('/', createAnnouncement);
router.put('/:id', updateAnnouncement);
router.delete('/:id', deleteAnnouncement);

export default router;

// Student routes (exported separately)
export const studentAnnouncementRouter = Router();
studentAnnouncementRouter.use(authenticate);
studentAnnouncementRouter.get('/', getStudentAnnouncements);
studentAnnouncementRouter.get('/unread-count', getUnreadCount);
studentAnnouncementRouter.post('/:id/read', markAsRead);
