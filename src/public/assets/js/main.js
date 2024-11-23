import * as Tone from 'tone';

let ws;
const sliders = {}; // Object voor sliders en hun grondtonen
const smoothingFactor = 0.1; // Voor soepele overgangen
const harmonics = 5; // Aantal boventonen

// Functie om een nieuwe slider met harmonischen oscillatoren te maken
function createSlider(address) {
    const container = document.createElement('div');
    container.classList.add('slider-container');

    const label = document.createElement('div');
    label.classList.add('slider-label');
    label.textContent = `Stream: ${address}`;
    container.appendChild(label);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 1;
    slider.step = 0.01;
    slider.value = 0;
    slider.classList.add('slider');
    container.appendChild(slider);

    document.getElementById('sliders-container').appendChild(container);

    // Tone.js setup: Maak een grondtoonoscillator en harmonischen
    const oscillators = [];
    const volumes = [];

    for (let i = 0; i <= harmonics; i++) {
        const oscillator = new Tone.Oscillator({
            frequency: 440 * (i + 1), // Grondtoon * harmonische index
            type: 'sine'
        }).start();

        const volume = new Tone.Volume(-Infinity).toDestination(); // Volume per oscillator
        oscillator.connect(volume);

        oscillators.push(oscillator);
        volumes.push(volume);
    }

    // Sla slider, oscillators en volumes op in de `sliders` object
    sliders[address] = { slider, oscillators, volumes, currentValue: 0 };
}

// Functie om harmonische oscillatoren te updaten
function updateSlider(address, value) {
    const data = sliders[address];
    if (data) {
        // Bereken de nieuwe waarde met smoothing
        data.currentValue = data.currentValue + smoothingFactor * (value - data.currentValue);

        // Update grondtoonfrequentie en harmonische volumes
        const baseFrequency = data.currentValue * 880; // Max grondtoon: 880 Hz
        data.oscillators.forEach((osc, i) => {
            osc.frequency.value = baseFrequency * (i + 1); // Harmonic frequencies
            data.volumes[i].volume.value = -10 * i - (1 / (data.currentValue || 1)); // Afname in amplitude
        });

        // Update slider in de UI
        data.slider.value = data.currentValue;
    } else {
        // Maak een nieuwe slider als deze nog niet bestaat
        createSlider(address);
    }
}

// Start WebSocket-verbinding en AudioContext
function startWebSocket() {
    // Start Tone.js AudioContext na gebruikersactie
    Tone.start().then(() => {
        console.log('Tone.js AudioContext gestart');
    }).catch((err) => {
        console.error('Error bij starten van Tone.js AudioContext:', err);
    });

    // Start WebSocket-verbinding
    ws = new WebSocket('ws://localhost:8080');

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
