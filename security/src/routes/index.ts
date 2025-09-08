import { Router } from 'express';
import authRoutes from './auth.routes';
import urlRoutes from './url.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/url', urlRoutes);

export default router;