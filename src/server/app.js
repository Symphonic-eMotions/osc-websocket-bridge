require('dotenv').config();

const path = require('path');
const express = require('express');
const { startOSCServer } = require('./oscServer');
const { startWebSocketServer } = require('./webSocketServer');
const pagesRoutes = require('./routes/pages');

const app = express();

// Stel EJS in als view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Gebruik routes
app.use('/', pagesRoutes);

// Statische bestanden
app.use(express.static(path.join(__dirname, '../public')));

// Start servers
const oscServer = startOSCServer();
const wss = startWebSocketServer();

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

// Start de Express-app
const PORT = process.env.HTTP_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Applicatie draait op http://localhost:${PORT}`);
});
