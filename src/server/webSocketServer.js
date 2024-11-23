const WebSocket = require('ws');
const config = require('./config');

function startWebSocketServer() {
    const port = config.websocket.port;

    const wss = new WebSocket.Server({ port });
    console.log(`WebSocket-server gestart op poort ${port}`);
    return wss;
}

module.exports = { startWebSocketServer };
