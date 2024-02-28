import express from 'express';
import {pingRouter, authRouter} from './lib/routes/index.js';

const app = express();

// Middleware
app.use(express.json());
// Routes
app.use('/', pingRouter);
app.use('/auth', authRouter);

export default app;
