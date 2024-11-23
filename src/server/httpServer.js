const http = require('http');
const fs = require('fs');
const path = require('path');
const { getLocalIPAddress } = require('./utils/network');
const config = require('./config');

function startHTTPServer() {
    const port = config.http.port;

    const server = http.createServer((req, res) => {
        const filePath = req.url === '/' ? path.join(__dirname, '../public/index.html') : path.join(__dirname, '../public', req.url);
        const extname = path.extname(filePath);
        let contentType = 'text/html';

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

    server.listen(port, () => {
        const localIP = getLocalIPAddress();
        console.log(`HTTP-server gestart: http://${localIP}:${port}`);
    });

    return server;
}

module.exports = { startHTTPServer };
