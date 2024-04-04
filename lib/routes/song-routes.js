import express from 'express';
import {
  authenticate, checkPermissions
} from '../controllers/auth-controllers.js';
import {
  addSong, deleteSong, getSong, getSongs, updateSong
} from '../controllers/song-controllers.js';

const router = express.Router();

router.route('/')
  .get(authenticate, getSongs)
  .post(authenticate, checkPermissions('admin'), addSong);

router.route('/:songId')
  .delete(authenticate, checkPermissions('admin'), deleteSong)
  .get(authenticate, getSong)
  .patch(authenticate, checkPermissions('admin'), updateSong);

export default router;
