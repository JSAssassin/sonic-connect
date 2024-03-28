import express from 'express';
import { authenticate, checkPermissions } from
  '../controllers/auth-controllers.js';
import addSong from '../controllers/song-controllers.js';

const router = express.Router();

router.route('/')
  .post(authenticate, checkPermissions('admin'), addSong);

export default router;
