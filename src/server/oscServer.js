const OSC = require('node-osc');

function startOSCServer(port = 8000, host = '0.0.0.0') {
    const oscServer = new OSC.Server(port, host);
    console.log(`OSC-server gestart op poort ${port}`);
    return oscServer;
}

module.exports = { startOSCServer };
