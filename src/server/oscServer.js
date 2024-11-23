const OSC = require('node-osc');
const config = require('./config');

function startOSCServer() {
    const { port, host } = config.osc;

    const oscServer = new OSC.Server(port, host);
    console.log(`OSC-server gestart op ${host}:${port}`);
    return oscServer;
}

module.exports = { startOSCServer };
