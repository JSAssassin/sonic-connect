import express from 'express';
import {
  authenticate, checkPermissions
} from '../controllers/auth-controllers.js';
import {
  addArtist, deleteArtist, getArtist, getArtists, updateArtist
} from '../controllers/artist-controllers.js';

const router = express.Router();

router.route('/')
  .get(authenticate, getArtists)
  .post(authenticate, checkPermissions('admin'), addArtist);

router.route('/:artistId')
  .delete(authenticate, checkPermissions('admin'), deleteArtist)
  .get(authenticate, getArtist)
  .patch(authenticate, checkPermissions('admin'), updateArtist);

export default router;
