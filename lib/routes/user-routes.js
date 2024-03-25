import express from 'express';
import {authenticate} from '../controllers/auth-controllers.js';
import {deactivateMe, updateMe} from '../controllers/user-controllers.js';

const router = express.Router();

router.route('/updateMe')
  .patch(authenticate, updateMe);
router.route('/deactivateMe')
  .delete(authenticate, deactivateMe);

export default router;
