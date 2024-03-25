import express from 'express';
import {authenticate} from '../controllers/auth-controllers.js';
import {
  deactivateMe, updateMe, updatePassword
} from '../controllers/user-controllers.js';

const router = express.Router();

router.route('/updateMe')
  .patch(authenticate, updateMe);
router.route('/deactivateMe')
  .delete(authenticate, deactivateMe);
router.route('/updatePassword')
  .patch(authenticate, updatePassword);

export default router;
