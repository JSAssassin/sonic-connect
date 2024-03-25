import express from 'express';
import { authRouter, pingRouter, userRouter } from './lib/routes/index.js';
import CustomError from './lib/utils/custom-error.js';
import globalErrorHandler from './lib/controllers/error-controller.js';

const app = express();

// Middleware
app.use(express.json());
// Routes
app.use('/api/v1/', pingRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.all('*', (req, res, next) => {
  const e =
    new CustomError(`Cannot find ${req.originalUrl} on the server.`, 404);
  next(e);
});

app.use(globalErrorHandler);

export default app;
