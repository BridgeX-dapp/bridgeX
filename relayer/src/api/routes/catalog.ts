import express from 'express';
import { addChain, listChains } from '../controllers/addChain';
import { addToken, listTokens } from '../controllers/addToken';
import { addTokenPair, listTokenPairs } from '../controllers/tokenPairs';

const router = express.Router();

router.route('/chains').post(addChain).get(listChains);
router.route('/tokens').post(addToken).get(listTokens);
router.route('/token-pairs').post(addTokenPair).get(listTokenPairs);

export default router;
