import express from 'express';
import { testFetcher } from '../controllers/hello';

const router = express.Router();

router.route('/').get(testFetcher);

export default router;
