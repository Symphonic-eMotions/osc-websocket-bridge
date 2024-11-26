import * as Tone from 'https://cdn.skypack.dev/tone';

class AudioEngine {
    constructor() {
        this.init();
        this.clock = new Tone.Clock((time) => {
            // Voorbeeld: je kunt hier acties uitvoeren per tick
            console.log('Clock tick minute:', time);
        }, 0.0167); // Clock op 1 tick per minuut
    }

    init() {
        const currentContext = Tone.getContext();
        if (currentContext.rawContext.state === 'closed') {
            console.log('AudioContext gesloten, een nieuwe context wordt gemaakt...');
            Tone.setContext(new Tone.Context());
        }

        this.gainNode = new Tone.Gain(1).toDestination();
        this.nodes = {};
        console.log('AudioEngine opnieuw geïnitialiseerd.');
    }

    startClock() {
        this.clock.start();
        console.log('Clock gestart');
    }

    stopClock() {
        this.clock.stop();
        console.log('Clock gestopt');
    }

    createOscillators(address, harmonics = 5) {
        if (!this.gainNode) {
            console.warn('AudioEngine is niet geïnitialiseerd. Roep init() eerst aan.');
            return;
        }

        if (this.nodes[address]) {
            console.warn(`Oscillators voor ${address} bestaan al.`);
            return;
        }

        const oscillators = [];
        const volumes = [];

        for (let i = 0; i <= harmonics; i++) {
            const oscillator = new Tone.Oscillator({
                frequency: 440 * (i + 1),
                type: 'sine',
            }).start();

            const volume = new Tone.Volume(-Infinity).connect(this.gainNode);
            oscillator.connect(volume);

            oscillators.push(oscillator);
            volumes.push(volume);
        }

        this.nodes[address] = { oscillators, volumes, currentValue: 0 };
    }

    updateOscillators(address, value, smoothingFactor = 0.1) {
        const data = this.nodes[address];
        if (!data) {
            console.warn(`Geen oscillators gevonden voor ${address}.`);
            return;
        }

        data.currentValue += smoothingFactor * (value - data.currentValue);

        const baseFrequency = data.currentValue * 880;
        data.oscillators.forEach((osc, i) => {
            osc.frequency.value = baseFrequency * (i + 1);
            data.volumes[i].volume.value = -10 * i - (1 / (data.currentValue || 1));
        });
    }

    updateAmplitude(address, value) {
        const data = this.nodes[address];
        if (!data) {
            console.warn(`Geen oscillators gevonden voor ${address}.`);
            return;
        }

        data.oscillators.forEach((osc, i) => {
            data.volumes[i].volume.value = value * -10;
        });
    }

    createOscillatorsFromHarmonics(address, harmonics) {
        if (!this.gainNode) {
            console.warn('AudioEngine is niet geïnitialiseerd. Roep init() eerst aan.');
            return;
        }

        if (this.nodes[address]) {
            console.warn(`Oscillators voor ${address} bestaan al.`);
            return;
        }

        const oscillators = [];
        const volumes = [];

        harmonics.forEach(({ frequency, normalizedAmplitude }) => {
            // Maak een oscillator voor elke harmonische
            const oscillator = new Tone.Oscillator({
                frequency: frequency, // Gebruik de frequentie uit de FFT
                type: 'sine',
            }).start();

            // Stel het volume in op basis van de genormaliseerde amplitude
            const volume = new Tone.Volume(-Infinity).connect(this.gainNode);
            volume.volume.value = Tone.gainToDb(normalizedAmplitude); // Zet amplitude om naar dB
            oscillator.connect(volume);

            oscillators.push(oscillator);
            volumes.push(volume);
        });

        this.nodes[address] = { oscillators, volumes };
        console.log(`Oscillators voor ${address} aangemaakt met ${harmonics.length} harmonischen.`);
    }


    fadeOutAndStop(duration = 1) {
        if (this.gainNode) {
            this.gainNode.gain.linearRampTo(0, duration);
        }

        setTimeout(() => {
            this.stopClock(); // Stop de clock als vervanging van Transport
            if (Tone.getContext().rawContext.state !== 'closed') {
                Tone.getContext().dispose();
                console.log('AudioEngine gestopt en AudioContext gesloten.');
            }
        }, duration * 1000);
    }

    async analyzeLocalAudio(filePath) {
        try {
            console.log(`Start analyse van: ${filePath}`);

            // Fetch het audiobestand
            const response = await fetch(filePath);
            const arrayBuffer = await response.arrayBuffer();

            // Decodeer het audiobestand
            const audioBuffer = await Tone.getContext().rawContext.decodeAudioData(arrayBuffer);

            // Pak het eerste kanaal voor FFT
            const channelData = audioBuffer.getChannelData(0);

            // Parameters voor FFT
            const fftSize = 2048; // Aantal samples per FFT
            const sampleRate = audioBuffer.sampleRate;

            // Buffer om de luidste frequenties te bewaren
            const loudestFrequencies = new Map(); // { frequency: maxNormalizedAmplitude }

            // Itereer over de audio in segmenten van fftSize
            for (let start = 0; start < channelData.length; start += fftSize) {
                const segment = channelData.slice(start, start + fftSize);

                // Gebruik FFT om frequenties en amplitudes te bepalen
                const analyser = Tone.getContext().createAnalyser();
                analyser.fftSize = fftSize;
                const bufferSource = Tone.getContext().createBufferSource();

                // Maak een audiobuffer van het segment
                const segmentBuffer = Tone.getContext().rawContext.createBuffer(1, segment.length, sampleRate);
                segmentBuffer.getChannelData(0).set(segment);

                bufferSource.buffer = segmentBuffer;
                bufferSource.connect(analyser);
                bufferSource.start();

                // Wacht tot de buffer is afgespeeld
                await new Promise((resolve) => (bufferSource.onended = resolve));

                // Haal frequentie- en amplitudegegevens op
                const frequencyData = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(frequencyData);

                const frequencies = Array.from({ length: frequencyData.length }, (_, i) =>
                    (i * sampleRate) / fftSize
                );

                // Bereken de maximum amplitude om te normaliseren
                const maxAmplitude = Math.max(...frequencyData);

                // Bijhouden van luidste frequenties met genormaliseerde amplitude
                frequencyData.forEach((amplitude, index) => {
                    const frequency = frequencies[index];
                    const normalizedAmplitude = amplitude / maxAmplitude; // Normaliseer naar (0-1)

                    if (
                        !loudestFrequencies.has(frequency) ||
                        loudestFrequencies.get(frequency) < normalizedAmplitude
                    ) {
                        loudestFrequencies.set(frequency, normalizedAmplitude);
                    }
                });
            }

            // Sorteer frequenties op genormaliseerde amplitude en pak de top 10
            const top10 = Array.from(loudestFrequencies)
                .map(([frequency, normalizedAmplitude]) => ({ frequency, normalizedAmplitude }))
                .sort((a, b) => b.normalizedAmplitude - a.normalizedAmplitude)
                .slice(0, 10);

            console.log('Top 10 frequenties met genormaliseerde amplitudes:', top10);
            return top10;
        } catch (error) {
            console.error('Fout bij audio-analyse:', error);
            return [];
        }
    }
}

export const audioEngine = new AudioEngine();
