// osc-websocket-bridge.js
const OSC = require('node-osc');
const WebSocket = require('ws');

// OSC server setup
const oscServer = new OSC.Server(12345, '0.0.0.0'); // Luister op poort 12345 voor OSC
console.log('OSC-server gestart op poort 12345');

// WebSocket server setup
const wss = new WebSocket.Server({ port: 8080 }); // Luister op poort 8080 voor WebSocket
console.log('WebSocket-server gestart op poort 8080');

// Handeling voor nieuwe WebSocket-verbindingen
wss.on('connection', function connection(ws) {
    console.log('Nieuwe WebSocket-verbinding');

    // OSC-berichten ontvangen en doorsturen naar WebSocket-clients
    oscServer.on('message', function (msg) {
        console.log('Ontvangen OSC-bericht:', msg);

        // OSC-bericht omzetten naar JSON om te versturen naar de browser
        const jsonMessage = JSON.stringify({ address: msg[0], args: msg.slice(1) });

        // Stuur bericht naar de verbonden WebSocket-client
        ws.send(jsonMessage);
    });

    // Handeling voor sluiting van de verbinding
    ws.on('close', () => {
        console.log('WebSocket-verbinding gesloten');
    });
});
