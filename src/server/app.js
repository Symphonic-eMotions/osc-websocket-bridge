const os = require('os');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('node-osc'); // `pkg` hint
require('ws'); // `pkg` hint

const OSC = require('node-osc');
const WebSocket = require('ws');

// Functie om het LAN IP-adres te bepalen
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Zoek naar de juiste interface die IPv4 gebruikt en geen interne (loopback) verbinding is
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Het LAN IP-adres ophalen
const localIP = getLocalIPAddress();

// HTTP-server om sliders.html en statische bestanden te serveren
const serverPort = 3000; // Poort voor de HTTP-server
const server = http.createServer((req, res) => {
    // Pad naar bestanden bepalen
    const filePath = req.url === '/' ? path.join(__dirname, '../public/index.html') : path.join(__dirname, '../public', req.url);
    const extname = path.extname(filePath);
    let contentType = 'text/html';

    // Content-type instellen op basis van bestandsextensie
    switch (extname) {
        case '.css':
            contentType = 'text/css';
            break;
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
    }

    // Bestand lezen en retourneren
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data, 'utf-8');
        }
    });
});

server.listen(serverPort, () => {
    console.log(`HTTP-server gestart: http://${localIP}:${serverPort}`);
});

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
