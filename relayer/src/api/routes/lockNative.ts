import express from 'express';
import { lockNative } from '../controllers/lockNative';
import { approveToken } from '../controllers/approveToken';
import { lockCanonicalOnCasper } from '../chains/casper/bridgeCore';
import { lockNativeCasper } from '../controllers/lockNativeOnCasper';
import { approveTokenCasper } from '../controllers/approveCep18';
import { setTokenConfig } from '../controllers/setTokenConfig';
import { mintWrapped } from '../controllers/mintWrapped';
import { debugGetTokenConfig } from '../controllers/debugTokenConfig';

const router = express.Router();

router.route('/').post(lockNative);
router.route('/approve').post(approveToken);
router.route('/casper').post(lockNativeCasper);
router.route('/approve-cep-18').post(approveTokenCasper);
router.route('/token-config').post(setTokenConfig);
router.route('/mint-wrapped').post(mintWrapped);
router.route('/debug').post(debugGetTokenConfig);

export default router;
