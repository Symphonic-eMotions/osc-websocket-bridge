import * as Tone from 'https://cdn.skypack.dev/tone';

import { ui } from './ui.js';
import { audioEngine } from './audioEngine.js';

let ws;

async function startWebSocket() {
    // Controleer of de AudioContext gesloten is
    if (Tone.context.state === 'closed') {
        console.log('AudioContext gesloten, opnieuw initialiseren...');
        audioEngine.init(); // Herinitialiseer de audio-engine
    }

    const response = await fetch('/api/local-ip');
    const { localIP } = await response.json();

    await Tone.start();
    console.log('Tone.js AudioContext gestart');

    const WS_PORT = 8080;
    ws = new WebSocket(`ws://${localIP}:${WS_PORT}`);

    ws.onopen = () => {
        console.log('Verbonden met WebSocket-server');
        updateButtonStates(false, true); // Start uitgeschakeld, Stop ingeschakeld
    };

    ws.onmessage = (event) => {
        const oscMessage = JSON.parse(event.data);
        const address = oscMessage.address;
        const args = oscMessage.args[0];
        const scaledValue = Math.max(0, Math.min(1, args));

        if (!ui.sliders[address]) {
            ui.createSlider(address); // Maak een nieuwe slider als deze nog niet bestaat
        }
        ui.updateSlider(address, scaledValue); // Update bestaande slider
        audioEngine.updateOscillators(address, scaledValue); // Update geluid
    };

    ws.onclose = () => {
        console.log('WebSocket-verbinding gesloten');
        updateButtonStates(true, false); // Start ingeschakeld, Stop uitgeschakeld
    };
}

function stopWebSocket() {
    if (ws) {
        audioEngine.fadeOutAndStop(1); // Fade-out en sluit audio-engine
        ws.close();
        ui.resetSliders();
    }
}

function updateButtonStates(startEnabled, stopEnabled) {
    const startButton = document.getElementById('start-button');
    const stopButton = document.getElementById('stop-button');

    // Startknop
    startButton.disabled = !startEnabled;
    startButton.classList.toggle('opacity-50', !startEnabled);
    startButton.classList.toggle('cursor-not-allowed', !startEnabled);

    // Stopknop
    stopButton.disabled = !stopEnabled;
    stopButton.classList.toggle('opacity-50', !stopEnabled);
    stopButton.classList.toggle('cursor-not-allowed', !stopEnabled);
}

document.getElementById('start-button').addEventListener('click', startWebSocket);
document.getElementById('stop-button').addEventListener('click', stopWebSocket);

document.addEventListener('DOMContentLoaded', () => {
    updateButtonStates(true, false); // Start ingeschakeld, Stop uitgeschakeld
});