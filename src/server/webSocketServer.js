const WebSocket = require('ws');

function startWebSocketServer(port = 8080) {
    const wss = new WebSocket.Server({ port });
    console.log(`WebSocket-server gestart op poort ${port}`);
    return wss;
}

module.exports = { startWebSocketServer };
