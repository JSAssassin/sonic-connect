import express from 'express';
import {
  authenticate, checkPermissions
} from '../controllers/auth-controllers.js';
import {
  deleteFile, getFile, uploadFile
} from '../controllers/file-controllers.js';

const router = express.Router();

router.route('/upload')
  .post(authenticate, checkPermissions('admin'), uploadFile);

router.route('/:filename')
  .get(authenticate, getFile)
  .delete(authenticate, checkPermissions('admin'), deleteFile);

export default router;
