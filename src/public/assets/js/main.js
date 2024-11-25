import * as Tone from 'https://cdn.skypack.dev/tone';
import { ui } from './ui.js';
import { audioEngine } from './audioEngine.js';

let ws;

// Get page attribute from script-tag
const scriptTag = document.getElementById('main-script'); // Gebruik expliciete ID
const mode = scriptTag.getAttribute('data-mode') || 'default';
console.log(`Huidige modus: ${mode}`);

async function startWebSocket() {
    // Controleer of de AudioContext gesloten is
    if (Tone.getContext().rawContext.state === 'closed') {
        console.log('AudioContext gesloten, opnieuw initialiseren...');
        audioEngine.init(); // Herinitialiseer de audio-engine
    }

    const response = await fetch('/api/local-ip');
    const { localIP } = await response.json();

    await Tone.start();
    console.log('Tone.js AudioContext gestart');

    const WS_PORT = 8080;
    ws = new WebSocket(`ws://${localIP}:${WS_PORT}`);

    ws.onopen = async () => {
        console.log('Verbonden met WebSocket-server');
        updateButtonStates(false, true); // Start uitgeschakeld, Stop ingeschakeld
        audioEngine.startClock(); // Start de clock

        if (mode === 'variatie') {
            // Analyseer audiobestand en geef resultaten door aan de UI
            const filePath = '/audio/sample.wav'; // Pad naar audiobestand
            const fftResults = await audioEngine.analyzeLocalAudio(filePath);
            ui.displayFFTResults(fftResults);
        }
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

        // Gebruik pagina-specifieke logica op basis van mode
        if (mode === 'boventoon') {
            audioEngine.updateOscillators(address, scaledValue);
        } else if (mode === 'variatie') {
            audioEngine.updateAmplitude(address, scaledValue);
        } else {
            console.warn(`Geen specifieke logica geïmplementeerd voor modus: ${mode}`);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket-verbinding gesloten');
        updateButtonStates(true, false); // Start ingeschakeld, Stop uitgeschakeld
        audioEngine.stopClock(); // Stop de clock als WebSocket sluit
    };
}

function stopWebSocket() {
    if (ws) {
        audioEngine.fadeOutAndStop(1); // Fade-out en sluit audio-engine
        ws.close();
        ui.resetSliders();
        audioEngine.stopClock(); // Zorg ervoor dat de clock wordt gestopt
    }
}

function updateButtonStates(startEnabled, stopEnabled) {
    const startButton = document.getElementById('start-button');
    const stopButton = document.getElementById('stop-button');

    startButton.disabled = !startEnabled;
    startButton.classList.toggle('opacity-50', !startEnabled);
    startButton.classList.toggle('cursor-not-allowed', !startEnabled);

    stopButton.disabled = !stopEnabled;
    stopButton.classList.toggle('opacity-50', !stopEnabled);
    stopButton.classList.toggle('cursor-not-allowed', !stopEnabled);
}

// Event listeners voor start- en stop-knoppen
document.getElementById('start-button').addEventListener('click', startWebSocket);
document.getElementById('stop-button').addEventListener('click', stopWebSocket);

// Initialiseer knoppen bij het laden van de pagina
document.addEventListener('DOMContentLoaded', () => {
    updateButtonStates(true, false); // Start ingeschakeld, Stop uitgeschakeld
});
