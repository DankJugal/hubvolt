const express = require('express');
const router = express.Router();

const authenticateAdmin = require('../middleware/authenticate');
const updateDeviceStatus = require('../controllers/hubvolt/updateDeviceStatus');
const registerDevice = require('../controllers/hubvolt/registerDevice');

// --- Public endpoint to register a device ---
router.post('/register', registerDevice);
// --- Admin-protected routes ---
// router.get('/all', authenticateAdmin, fetchAllDevices);
// router.get('/:device_name', authenticateAdmin, fetchDevice);
router.post('/control/:device_name/:status', updateDeviceStatus);
// router.delete('/:device_name', authenticateAdmin, removeDevice);

module.exports = router;
