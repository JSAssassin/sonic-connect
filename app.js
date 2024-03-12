import express from 'express';
import {authRouter, pingRouter} from './lib/routes/index.js';
import CustomError from './lib/utils/custom-error.js';
import globalErrorHandler from './lib/controllers/error-controller.js';

const app = express();

// Middleware
app.use(express.json());
// Routes
app.use('/', pingRouter);
app.use('/auth', authRouter);
app.all('*', (req, res, next) => {
  const e =
    new CustomError(`Cannot find ${req.originalUrl} on the server.`, 404);
  next(e);
});

app.use(globalErrorHandler);

export default app;
