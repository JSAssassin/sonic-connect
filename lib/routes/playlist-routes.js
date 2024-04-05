import express from 'express';
import {
  authenticate, checkPermissions
} from '../controllers/auth-controllers.js';
import {
  addPlaylist, deletePlaylist, getPlaylist, getPlaylists, updatePlaylist
} from '../controllers/playlist-controllers.js';

const router = express.Router();

router.route('/')
  .get(authenticate, getPlaylists)
  .post(authenticate, checkPermissions('user'), addPlaylist);

router.route('/:playlistId')
  .delete(authenticate, checkPermissions('user'), deletePlaylist)
  .get(authenticate, getPlaylist)
  .patch(authenticate, checkPermissions('user'), updatePlaylist);

export default router;
