const express = require('express');
const router = express.Router();
const { getLocalIPAddress } = require('../utils/network');

// API-route om het lokale IP-adres te verkrijgen
router.get('/local-ip', (req, res) => {
    const localIP = getLocalIPAddress();
    res.json({ localIP });
});

module.exports = router;
