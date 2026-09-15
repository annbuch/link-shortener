const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/overview', analyticsController.getOverview);

router.get('/links/:id/analytics', analyticsController.getAnalytics);
router.get('/links/:id/analytics/clicks', analyticsController.getClicksList);
router.get('/links/:id/analytics/daily', analyticsController.getDaily);
router.get('/links/:id/analytics/geolocation', analyticsController.getGeo);
router.get('/links/:id/analytics/devices', analyticsController.getDevices);
router.get('/links/:id/analytics/referrers', analyticsController.getReferrers);
router.get('/links/:id/export/csv', analyticsController.exportCSV);
router.get('/links/:id/export/pdf', analyticsController.exportPDF);

module.exports = router;