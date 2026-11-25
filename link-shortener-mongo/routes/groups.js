'use strict';

const express = require('express');
const groupController = require('../controllers/groupController');

const router = express.Router();

router.get('/', groupController.listGroups);
router.post('/', groupController.createGroup);
router.get('/:id', groupController.getGroup);
router.put('/:id', groupController.updateGroup);
router.patch('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

module.exports = router;
