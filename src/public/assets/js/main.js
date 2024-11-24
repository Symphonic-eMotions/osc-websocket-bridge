
// Start WebSocket-verbinding en AudioContext
// Functie om het lokale IP-adres op te halen via de server API
async function getLocalIPAddress() {
    try {
        const response = await fetch('/api/local-ip');
        if (response.ok) {
            const data = await response.json();
            return data.localIP; // Retourneert het IP-adres
        } else {
            console.error('Failed to fetch local IP:', response.statusText);
        }
    } catch (err) {
        console.error('Error fetching local IP:', err);
    }
    return null;
}

// Start WebSocket-verbinding en AudioContext
async function startWebSocket() {
    // Haal het lokale IP-adres op via de API
    const localIP = await getLocalIPAddress();
    if (!localIP) {
        console.error('Kan geen lokaal IP-adres ophalen.');
        return;
    }

    // Start Tone.js AudioContext na gebruikersactie
    Tone.start().then(() => {
        console.log('Tone.js AudioContext gestart');
    }).catch((err) => {
        console.error('Error bij starten van Tone.js AudioContext:', err);
    });

    const WS_PORT = 8080; // Gebruik een vaste poort
    ws = new WebSocket(`ws://${localIP}:${WS_PORT}`); // Gebruik het IP-adres en poort

    ws.onopen = () => {
        console.log('Verbonden met WebSocket-server');
        document.getElementById('start-button').disabled = true;
        document.getElementById('stop-button').disabled = false;
    };

    ws.onmessage = (event) => {
        const oscMessage = JSON.parse(event.data);
        console.log('Ontvangen OSC bericht:', oscMessage);

        const address = oscMessage.address;
        const args = oscMessage.args[0]; // Eerste argument

        const scaledValue = Math.max(0, Math.min(1, args)); // Normaliseer tussen 0-1
        updateSlider(address, scaledValue);
    };

    ws.onclose = () => {
        console.log('WebSocket-verbinding gesloten');
        document.getElementById('start-button').disabled = false;
        document.getElementById('stop-button').disabled = true;
    };
}

// Stop WebSocket-verbinding
function stopWebSocket() {
    if (ws) {
        ws.close();
        console.log('WebSocket-verbinding wordt gesloten');
    }
}

document.getElementById('start-button').addEventListener('click', startWebSocket);
document.getElementById('stop-button').addEventListener('click', stopWebSocket);
