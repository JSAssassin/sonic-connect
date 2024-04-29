import express from 'express';
import {
  authenticate, checkPermissions
} from '../controllers/auth-controllers.js';
import {
  addPlaylist, addSongsToPlaylist, deletePlaylist, getPlaylist, getPlaylists,
  removeSongsFromPlaylist, updatePlaylist,
} from '../controllers/playlist-controllers.js';

const router = express.Router();

router.route('/')
  .get(authenticate, getPlaylists)
  .post(authenticate, checkPermissions('user', 'admin'), addPlaylist);

router.route('/:playlistId')
  .delete(authenticate, checkPermissions('user', 'admin'), deletePlaylist)
  .get(authenticate, getPlaylist)
  .patch(authenticate, checkPermissions('user', 'admin'), updatePlaylist);

router.route('/:playlistId/songs')
  .post(
    authenticate, checkPermissions('user', 'admin'), addSongsToPlaylist)
  .delete(
    authenticate, checkPermissions('user', 'admin'), removeSongsFromPlaylist);

export default router;
