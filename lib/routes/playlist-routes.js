import express from 'express';
import { authenticate } from '../controllers/auth-controllers.js';
import {
  addPlaylist, addSongsToPlaylist, deletePlaylist, getPlaylist, getPlaylists,
  removeSongsFromPlaylist, updatePlaylist,
} from '../controllers/playlist-controllers.js';

const router = express.Router();

router.route('/')
  .get(authenticate, getPlaylists)
  .post(authenticate, addPlaylist);

router.route('/:playlistId')
  .delete(authenticate, deletePlaylist)
  .get(authenticate, getPlaylist)
  .patch(authenticate, updatePlaylist);

router.route('/:playlistId/songs')
  .post(authenticate, addSongsToPlaylist)
  .delete(
    authenticate, removeSongsFromPlaylist
  );

export default router;
