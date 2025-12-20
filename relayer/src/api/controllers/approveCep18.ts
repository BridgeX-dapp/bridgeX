import expressAsyncHandler from 'express-async-handler';
import { approveOnCasper } from '../chains/casper/bridgeUtils/approveCep18';
import { toTokenUnits } from '../chains/casper/utils';

export const approveTokenCasper = expressAsyncHandler(async (req, res) => {
  const { tokenH, amount } = req.body;
  const token =
    'b80fe386feaaec091183cd0587c5de3fd402e70d3f3b50e28f6b662b9a486d3e';

  const decimals = 6;

  const amountRaw = toTokenUnits(amount, decimals).toString();

  const result = await approveOnCasper({
    token,
    spender: process.env.CASPER_BRIDGE_CORE_HASH,
    amount: BigInt(amountRaw),
  });

  res.status(200).json({
    result: 'Approved token on Casper',
    deployHash: result.deployHash,
    explorerUrl: `https://testnet.cspr.live/deploy/${result.deployHash}`,
  });
});
