require('dotenv').config();

// Cross-platform compatible paths
const path = require('path');
// Local webserver
const express = require('express');
// Local OSC server
const { startOSCServer } = require('./oscServer');
// Webpage connector
const { startWebSocketServer } = require('./webSocketServer');
// Pages controller
const pagesRoutes = require('./routes/pages');
// Api controller
const apiRoutes = require('./routes/api');

// The app is the webserver
const app = express();

// EJS View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Pages controller returns routes
app.use('/', pagesRoutes);
app.use('/api', apiRoutes);

// Pass webserver pages locations for dynamic pages navigation
app.use(express.static(path.join(__dirname, '../public')));

// Start servers
const oscServer = startOSCServer();
const wss = startWebSocketServer();

// Store unique OSC-adresses
const uniqueAddresses = new Set();

// Take care of new WebSocket connections
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
const { getLocalIPAddress } = require('./utils/network');
app.listen(PORT, () => {
    const localIP = getLocalIPAddress(); // Roep de functie aan
    console.log(`Applicatie draait op http://${localIP}:${PORT}`);
});
