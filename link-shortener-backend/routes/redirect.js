const express = require('express');
const router = express.Router();
const redirectController = require('../controllers/redirectController');

router.get('/:shortCode', redirectController.redirect);
router.post('/:shortCode/verify', redirectController.verifyPassword);

module.exports = router;