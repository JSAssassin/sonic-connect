import express from 'express';
import {pingRouter, authRouter} from './lib/routes/index.js';

const app = express();

// Middleware
app.use(express.json());
// Routes
app.use('/', pingRouter);
app.use('/auth', authRouter);
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Cannot find ${req.originalUrl} on the server.`
  });
});

export default app;
