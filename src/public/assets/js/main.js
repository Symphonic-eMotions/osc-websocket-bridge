import * as Tone from 'https://cdn.skypack.dev/tone';

let ws;
let updateSlider;

// Functie om dynamisch een module te laden
async function loadModule(modulePath) {
    try {
        const module = await import(modulePath);
        if (module.updateSlider) {
            updateSlider = module.updateSlider;
        }
        console.log(`Module ${modulePath} succesvol geladen`);
    } catch (err) {
        console.error(`Fout bij het laden van module ${modulePath}:`, err);
    }
}

function updateButtonStates(startEnabled, stopEnabled) {
    const startButton = document.getElementById('start-button');
    const stopButton = document.getElementById('stop-button');

    // Startknop
    startButton.disabled = !startEnabled;
    startButton.classList.toggle('opacity-50', !startEnabled); // Voeg visuele feedback toe
    startButton.classList.toggle('cursor-not-allowed', !startEnabled);

    // Stopknop
    stopButton.disabled = !stopEnabled;
    stopButton.classList.toggle('opacity-50', !stopEnabled);
    stopButton.classList.toggle('cursor-not-allowed', !stopEnabled);
}

// Start WebSocket-verbinding en AudioContext
async function startWebSocket() {
    const response = await fetch('/api/local-ip');
    const { localIP } = await response.json();

    Tone.start().then(() => {
        console.log('Tone.js AudioContext gestart');
    });

    const WS_PORT = 8080;
    ws = new WebSocket(`ws://${localIP}:${WS_PORT}`);

    ws.onopen = () => {
        console.log('Verbonden met WebSocket-server');
        updateButtonStates(false, true); // Start uitgeschakeld, Stop ingeschakeld
    };

    ws.onmessage = (event) => {
        const oscMessage = JSON.parse(event.data);
        console.log('Ontvangen OSC bericht:', oscMessage);

        const address = oscMessage.address;
        const args = oscMessage.args[0];
        const scaledValue = Math.max(0, Math.min(1, args));

        if (updateSlider) {
            updateSlider(address, scaledValue);
        } else {
            console.warn('updateSlider is niet geladen!');
        }
    };

    ws.onclose = () => {
        console.log('WebSocket-verbinding gesloten');
        updateButtonStates(true, false); // Start ingeschakeld, Stop uitgeschakeld
    };
}

// Stop WebSocket-verbinding
function stopWebSocket() {
    if (ws) {
        // Start een fade-out
        // gainNode.gain.linearRampTo(0, 1); // Fade-out naar 0 in 1 seconde

        setTimeout(() => {
            // Stop alle audio en sluit de WebSocket-verbinding
            Tone.stop(); // Stop de Transport als die wordt gebruikt
            ws.close();            // Sluit de WebSocket
            console.log('WebSocket-verbinding wordt gesloten en audio gestopt');
        }, 100); // Wacht tot de fade-out is voltooid
    }
}

// Event listeners
document.getElementById('start-button').addEventListener('click', () => {
    console.log('Start-knop ingedrukt');
    startWebSocket();
});

document.getElementById('stop-button').addEventListener('click', () => {
    console.log('Stop-knop ingedrukt');
    stopWebSocket();
});

// Zorg dat het pad naar de module dynamisch is
document.addEventListener('DOMContentLoaded', () => {
    const scriptTag = document.getElementById('main-script'); // Zoek expliciet naar de <script>-tag
    if (scriptTag) {
        const modulePath = scriptTag.getAttribute('data-module');
        if (modulePath) {
            loadModule(modulePath)
                .then(() => console.log(`Module ${modulePath} succesvol geladen en verwerkt`))
                .catch(err => console.error(`Fout bij het laden van de module ${modulePath}:`, err));
        }
    }
    document.addEventListener('DOMContentLoaded', () => {
        updateButtonStates(true, false); // Start ingeschakeld, Stop uitgeschakeld
    });
});
