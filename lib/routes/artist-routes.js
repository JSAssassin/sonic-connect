import express from 'express';
import { authenticate, checkPermissions } from
  '../controllers/auth-controllers.js';
import addArtist from '../controllers/artist-controllers.js';

const router = express.Router();

router.route('/')
  .post(authenticate, checkPermissions('admin'), addArtist);

export default router;
