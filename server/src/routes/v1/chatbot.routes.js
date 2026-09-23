import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { answer } from '../../services/chatbot/index.js';

const router = Router();
const limiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Please slow down a little.', errors: [] } });

router.post('/', limiter, validate({ body: z.object({ message: z.string().trim().min(1).max(500) }) }), asyncHandler(async (req, res) => sendSuccess(res, { data: await answer({ message: req.body.message }) })));

export default router;
