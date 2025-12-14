import express from 'express';
import { lockNative } from '../controllers/lockNative';
import { approveToken } from '../controllers/approveToken';

const router = express.Router();

router.route('/').post(lockNative);
router.route('/approve').post(approveToken);

export default router;
