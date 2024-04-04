import express from 'express';
import {
  authenticate, checkPermissions
} from '../controllers/auth-controllers.js';
import {
  addAlbum, deleteAlbum, getAlbum, getAlbums, updateAlbum
} from '../controllers/album-controllers.js';

const router = express.Router();

router.route('/')
  .get(authenticate, getAlbums)
  .post(authenticate, checkPermissions('admin'), addAlbum);

router.route('/:albumId')
  .delete(authenticate, checkPermissions('admin'), deleteAlbum)
  .get(authenticate, getAlbum)
  .patch(authenticate, checkPermissions('admin'), updateAlbum);

export default router;
