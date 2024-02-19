import express from 'express';
import pingRoute from './pingRoute.js';

const router = express.Router();

router.use('/rest', pingRoute);

export default router;
