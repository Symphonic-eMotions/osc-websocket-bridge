require('node-osc'); // `pkg` hint
require('ws'); // `pkg` hint

const OSC = require('node-osc');
const WebSocket = require('ws');

// OSC server setup
const oscServer = new OSC.Server(8000, '0.0.0.0'); // Luister op poort 8000 voor OSC
console.log('OSC-server gestart op poort 8000');

// WebSocket server setup
const wss = new WebSocket.Server({ port: 8080 }); // Luister op poort 8080 voor WebSocket
console.log('WebSocket-server gestart op poort 8080');

// Set om unieke OSC-adressen bij te houden
const uniqueAddresses = new Set();

// Handeling voor nieuwe WebSocket-verbindingen
wss.on('connection', function connection(ws) {
    console.log('Nieuwe WebSocket-verbinding');

    // OSC-berichten ontvangen en doorsturen naar WebSocket-clients
    oscServer.on('message', function (msg) {
        const address = msg[0]; // Het adres van het OSC-bericht

        // Log alleen de eerste keer een uniek adres
        if (!uniqueAddresses.has(address)) {
            uniqueAddresses.add(address);
            console.log('Ontvangen uniek OSC-bericht:', address);
        }

        // OSC-bericht omzetten naar JSON om te versturen naar de browser
        const jsonMessage = JSON.stringify({ address: address, args: msg.slice(1) });

        // Stuur bericht naar de verbonden WebSocket-client
        ws.send(jsonMessage);
    });

    // Handeling voor sluiting van de verbinding
    ws.on('close', () => {
        console.log('WebSocket-verbinding gesloten');
    });
});
