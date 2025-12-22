import express from 'express';
import { addChain, listChains } from '../controllers/addChain';
import { addToken, listTokens } from '../controllers/addToken';

const router = express.Router();

router.route('/chains').post(addChain).get(listChains);
router.route('/tokens').post(addToken).get(listTokens);

export default router;
