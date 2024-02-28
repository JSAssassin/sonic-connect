import express from 'express';
import ping from '../controllers/ping-controller.js';

const router = express.Router();

router.route('/ping')
  .get(ping);

export default router;
