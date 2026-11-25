'use strict';

const express = require('express');
const redirectController = require('../controllers/redirectController');

const router = express.Router();

router.get('/:shortCode', redirectController.redirect);
router.post('/:shortCode/verify', redirectController.verifyPassword);

module.exports = router;
