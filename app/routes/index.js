import express from 'express';
import pingRoute from './pingRoute.js';
import userRoutes from './userRoutes.js';

const router = express.Router();

router.use('/', pingRoute);
router.use('/users', userRoutes);

export default router;
