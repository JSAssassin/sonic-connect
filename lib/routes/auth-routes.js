import express from 'express';
import {
  forgotPassword, login, register, resetPassword
} from '../controllers/auth-controllers.js';

const router = express.Router();

router.route('/login')
  .post(login);
router.route('/register')
  .post(register);
router.route('/forgotPassword')
  .post(forgotPassword);
router.route('/resetPassword/:token')
  .patch(resetPassword);

export default router;
