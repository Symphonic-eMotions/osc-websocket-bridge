module.exports = {
    http: {
        port: process.env.HTTP_PORT || 3000, // HTTP server poort
    },
    osc: {
        port: process.env.OSC_PORT || 8000, // OSC server poort
        host: process.env.OSC_HOST || '0.0.0.0', // OSC server host
    },
    websocket: {
        port: process.env.WS_PORT || 8080, // WebSocket server poort
    },
    app: {
        environment: process.env.NODE_ENV || 'development', // Omgevingsvariabele
    },
};
