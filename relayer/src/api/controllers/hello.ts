import expressAsyncHandler from 'express-async-handler';
import {
  createCasperRestClient,
  fetchLatestCasperBlockHeight,
} from '../chains/casper/provider';

export const testFetcher = expressAsyncHandler(async (req, res) => {
  try {
    const restClient = createCasperRestClient();
    const height = await fetchLatestCasperBlockHeight(restClient);
    res.status(200).json({
      result: 'fetched block height',
      height,
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
});
