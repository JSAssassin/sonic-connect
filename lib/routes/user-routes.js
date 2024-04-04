import express from 'express';
import {
  authenticate, checkPermissions
} from '../controllers/auth-controllers.js';
import {
  deactivateProfile, getAllUsers, getProfile, getUser, updateProfile,
  updatePassword
} from '../controllers/user-controllers.js';

const router = express.Router();

router.route('/profile')
  .get(authenticate, getProfile)
  .patch(authenticate, updateProfile)
  .delete(authenticate, deactivateProfile);
router.route('/profile/password')
  .patch(authenticate, updatePassword);
router.route('/')
  .get(authenticate, checkPermissions('admin'), getAllUsers);
router.route('/:id')
  .get(authenticate, checkPermissions('admin'), getUser);

export default router;
