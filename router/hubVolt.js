const express = require('express');
const router = express.Router();

const registerDevice = require('../controllers/hubvolt/registerDevice');

router.post('/register', registerDevice);


module.exports = router;
