import expressAsyncHandler from 'express-async-handler';
import { approveOnCasper } from '../chains/casper/bridge-core/approveCep18';
import { loadCasperConfig } from '../chains/casper/config';
import { normalizeAmountInput } from '../lib/utils/amount';

export const approveTokenCasper = expressAsyncHandler(async (req, res) => {
  const { token, amount, decimals } = req.body;
  const config = loadCasperConfig();
  /*const token =
    'b80fe386feaaec091183cd0587c5de3fd402e70d3f3b50e28f6b662b9a486d3e';*/

  const amountRaw = normalizeAmountInput({
    amount,
    decimals: decimals !== undefined ? Number(decimals) : 6,
  });

  const result = await approveOnCasper({
    token,
    spender: config.CASPER_BRIDGE_CORE_CONTRACT_PACKAGE_HASH,
    amount: BigInt(amountRaw),
  });

  res.status(200).json({
    result: 'Approved token on Casper',
    deployHash: result.deployHash,
    explorerUrl: `https://testnet.cspr.live/deploy/${result.deployHash}`,
  });
});
