import { Router, Request, Response } from 'express';
const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

router.get('/readyz', (req: Request, res: Response) => {
  res.status(200).json({ ready: true });
});



export default router;
