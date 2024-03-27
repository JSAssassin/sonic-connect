import express from 'express';
import {authenticate, checkPermissions} from '../controllers/auth-controllers.js';
import {
  deactivateProfile, getAllUsers, getProfile, getUser, updateProfile,
  updatePassword
} from '../controllers/user-controllers.js';

const router = express.Router();

router.route('/profile')
  .get(authenticate, getProfile);
router.route('/profile/update')
  .patch(authenticate, updateProfile);
router.route('/profile/deactivate')
  .delete(authenticate, deactivateProfile);
router.route('/password/update')
  .patch(authenticate, updatePassword);
router.route('/')
  .get(authenticate, checkPermissions('admin'), getAllUsers);
router.route('/:id')
  .get(authenticate, checkPermissions('admin'), getUser);

export default router;
