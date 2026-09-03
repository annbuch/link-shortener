const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);
router.get('/me', userController.getProfile);
router.put('/me', userController.updateProfile);
router.put('/me/password', userController.changePassword);
router.get('/me/settings', userController.getSettings);
router.put('/me/settings', userController.updateSettings);

module.exports = router;