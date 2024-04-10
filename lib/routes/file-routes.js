import express from 'express';
import { uploadFile } from '../controllers/file-controllers.js';

const router = express.Router();

router.route('/upload')
  .post(uploadFile);

export default router;
