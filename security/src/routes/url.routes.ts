import { Router } from 'express';
import { scanUrl, processMessage } from '../controllers/url.controller';

const router = Router();

/**
 * @route POST /security/url/scan
 * @desc Scan a URL for safety and categorization
 * @access Public
 */
router.post('/scan', scanUrl);

/**
 * @route POST /security/url/process-message
 * @desc Process a message and check any URLs it contains
 * @access Public
 */
router.post('/process-message', processMessage);

export default router;