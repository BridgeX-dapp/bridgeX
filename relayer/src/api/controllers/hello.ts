import expressAsyncHandler from 'express-async-handler';

export const testFetcher = expressAsyncHandler(async (req, res) => {
  
  res.status(200).json({
    result: "Hello world",
  });
});
