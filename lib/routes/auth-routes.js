import express from 'express';
import {
  authenticate, forgotPassword, login, logout, resetPassword, signup
} from '../controllers/auth-controllers.js';

const router = express.Router();

router.route('/login')
  .post(login);
router.route('/logout')
  .post(authenticate, logout);
router.route('/signup')
  .post(signup);
router.route('/forgotPassword')
  .post(forgotPassword);
router.route('/resetPassword/:token')
  .patch(resetPassword);

export default router;
