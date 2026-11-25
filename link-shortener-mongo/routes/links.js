'use strict';

const express = require('express');
const linkController = require('../controllers/linkController');

const router = express.Router();

// Статические маршруты должны идти раньше /:id
router.get('/stats/overview', linkController.getOverview);

router.get('/', linkController.listLinks);
router.post('/', linkController.createLink);

router.get('/:id', linkController.getLink);
router.put('/:id', linkController.updateLink);
router.patch('/:id', linkController.updateLink);
router.delete('/:id', linkController.deleteLink);

// Работа с вложенными документами
router.post('/:id/clicks', linkController.addClick);
router.patch('/:id/clicks/:clickId', linkController.updateClick);
router.delete('/:id/clicks/:clickId', linkController.deleteClick);

router.post('/:id/tags', linkController.addTag);
router.delete('/:id/tags/:tag', linkController.removeTag);

router.get('/:id/stats', linkController.getLinkStats);

module.exports = router;
