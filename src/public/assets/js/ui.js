import { audioEngine } from './audioEngine.js';

class UI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.sliders = {}; // Houd bij welke sliders al zijn gemaakt
    }

    createSlider(address) {
        // Controleer of de slider al bestaat
        if (this.sliders[address]) {
            console.warn(`Slider voor ${address} bestaat al.`);
            return;
        }

        // Hoofdslider voor het adres
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
        slider.classList.add('slider', 'w-full'); // Brede slider
        container.appendChild(slider);

        // Event voor het wijzigen van de hoofdslider
        slider.addEventListener('input', (event) => {
            const value = parseFloat(event.target.value);
            audioEngine.updateOscillators(address, value);
        });

        this.container.appendChild(container);
        this.sliders[address] = slider; // Sla de hoofdslider op

        // Voeg amplitude- en frequentie-LFO-sliders toe
        this.createLFO(address, 'amplitude');
        this.createLFO(address, 'frequency');
    }

    // Helper-methode voor sliders
    _createSliderElement(id, label) {
        const container = document.createElement('div');
        container.classList.add('slider-container');

        const sliderLabel = document.createElement('label');
        sliderLabel.textContent = label;
        container.appendChild(sliderLabel);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = id;
        slider.min = '0';
        slider.max = '1';
        slider.step = '0.01';
        slider.value = '0';
        container.appendChild(slider);

        return { container, slider };
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

    createLFO(baseAddress, lfoType) {
        const address = `${baseAddress}-${lfoType}-lfo`;
        if (this.sliders[address]) {
            console.warn(`LFO-slider voor ${address} bestaat al.`);
            return;
        }

        const slider = this._createSliderElement(address, `${lfoType.charAt(0).toUpperCase() + lfoType.slice(1)} LFO`);
        slider.addEventListener('input', (event) => {
            const value = parseFloat(event.target.value);
            audioEngine.updateLFOs(baseAddress, lfoType, value);
        });

        this.container.appendChild(slider.container);
        this.sliders[address] = slider.slider;
    }

    displayFFTResults(fftResults) {
        const container = document.getElementById('sliders-container');
        container.innerHTML = ''; // Maak de container leeg

        fftResults.forEach(({ frequency, amplitude }) => {
            const freqElement = document.createElement('div');
            freqElement.textContent = `Freq: ${frequency}, Amp: ${amplitude}`; // Gebruik direct de geformatteerde strings
            freqElement.classList.add('fft-result');
            container.appendChild(freqElement);
        });
    }
}

export const ui = new UI('sliders-container');
