import express from 'express';
import { lockNativeCasper } from '../controllers/lockNativeOnCasper';
import { approveTokenCasper } from '../controllers/approveCep18';
import { setTokenConfig } from '../controllers/setTokenConfig';
import { mintWrapped } from '../controllers/mintWrapped';
import { debugGetTokenConfig } from '../controllers/debugTokenConfig';
import { lockCanonicalEvm } from '../controllers/lockCanonicalOnEvm';
import { burnWrappedEvm } from '../controllers/burnWrappedOnEvm';
import { mintFromLockEvm } from '../controllers/mintFromLockOnEvm';
import { unlockFromBurnEvm } from '../controllers/unlockFromBurnOnEvm';
import { setTokenConfigEvm } from '../controllers/setTokenConfigOnEvm';
import { approveErc20Evm } from '../controllers/approveErc20OnEvm';

const router = express.Router();

// EVM
router.route('/evm/lock-canonical').post(lockCanonicalEvm);
router.route('/evm/burn-wrapped').post(burnWrappedEvm);
router.route('/evm/mint-from-lock').post(mintFromLockEvm);
router.route('/evm/unlock-from-burn').post(unlockFromBurnEvm);
router.route('/evm/set-token-config').post(setTokenConfigEvm);
router.route('/evm/approve-erc20').post(approveErc20Evm);

// Casper
router.route('/casper').post(lockNativeCasper);
router.route('/approve-cep-18').post(approveTokenCasper);
router.route('/token-config').post(setTokenConfig);
router.route('/mint-wrapped').post(mintWrapped);
router.route('/debug').post(debugGetTokenConfig);

export default router;
