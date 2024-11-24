import { audioEngine } from './audioEngine.js';

class UI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.sliders = {}; // Houd bij welke sliders al zijn gemaakt
    }

    createSlider(address) {
        if (this.sliders[address]) {
            console.warn(`Slider voor ${address} bestaat al.`);
            return; // Slider is al gemaakt, doe niets
        }

        const container = document.createElement('div');
        container.classList.add('slider-container');

        const label = document.createElement('div');
        label.classList.add('slider-label');
        label.textContent = `Stream: ${address}`;
        container.appendChild(label);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '1';
        slider.step = '0.01';
        slider.value = '0';
        slider.classList.add('slider', 'w-full'); // Voeg w-full toe voor volledige breedte
        container.appendChild(slider);

        slider.addEventListener('input', (event) => {
            const value = parseFloat(event.target.value);
            audioEngine.updateOscillators(address, value);
        });

        this.container.appendChild(container);
        this.sliders[address] = slider; // Sla de slider op
        audioEngine.createOscillators(address);
    }

    updateSlider(address, value) {
        const slider = this.sliders[address];
        if (slider) {
            slider.value = value; // Update de waarde van de slider
        } else {
            console.warn(`Geen slider gevonden voor ${address}.`);
        }
    }

    resetSliders() {
        // Verwijder alle slider-elementen uit de container
        this.container.innerHTML = '';
        // Leeg de sliders-array
        this.sliders = {};
        console.log('Alle sliders zijn gereset.');
    }
}

export const ui = new UI('sliders-container');
