import express from 'express';
import {authenticate, checkPermissions} from '../controllers/auth-controllers.js';
import {
  deactivateMe, getAllUsers, getUser, updateMe, updatePassword
} from '../controllers/user-controllers.js';

const router = express.Router();

router.route('/updateMe')
  .patch(authenticate, updateMe);
router.route('/deactivateMe')
  .delete(authenticate, deactivateMe);
router.route('/updatePassword')
  .patch(authenticate, updatePassword);
router.route('/')
  .get(authenticate, checkPermissions('admin'), getAllUsers);
router.route('/:id')
  .get(authenticate, checkPermissions('admin'), getUser);

export default router;
