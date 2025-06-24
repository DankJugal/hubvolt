const express = require('express');
const router = express.Router();

const getDevices = require('../controllers/hubvolt/getDevices');
const updateDevice = require('../controllers/hubvolt/updateDevice');
const deleteDevice = require('../controllers/hubvolt/deleteDevice');
const registerDevice = require('../controllers/hubvolt/registerDevice');

router.post('/register', registerDevice);
router.get('/devices', getDevices);
router.put('/update/:device_name', updateDevice);
router.delete('/delete/:device_name', deleteDevice);


module.exports = router;
