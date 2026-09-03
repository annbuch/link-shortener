const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');
const { authenticate } = require('../middlewares/auth');

//защита
router.use(authenticate);

router.get('/', linkController.getAllLinks);
router.post('/', linkController.createLink);
router.get('/trash', linkController.getTrash);
router.delete('/trash/empty', linkController.emptyTrash);
router.get('/:id', linkController.getLinkById);
router.put('/:id', linkController.updateLink);
router.delete('/:id', linkController.deleteLink);
router.post('/:id/restore', linkController.restoreLink);
router.post('/:id/activate', linkController.activateLink);
router.post('/:id/deactivate', linkController.deactivateLink);
router.get('/:id/qr', linkController.getQR);
router.get('/:id/preview', linkController.getPreview);

module.exports = router;