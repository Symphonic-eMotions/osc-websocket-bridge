import * as Tone from 'https://cdn.skypack.dev/tone';

class AudioEngine {
    constructor() {
        this.init();
        this.clock = new Tone.Clock((time) => {
            // Voorbeeld: je kunt hier acties uitvoeren per tick
            // console.log('Clock tick:', time);
        }, 1); // Clock op 1 Hz
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

            // Gebruik de AnalyserNode voor FFT
            const analyser = Tone.getContext().createAnalyser();
            analyser.fftSize = 2048;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Float32Array(bufferLength);

            // Vul analyser met kanaaldata
            const source = Tone.getContext().createBufferSource();
            source.buffer = audioBuffer;
            source.connect(analyser);
            analyser.connect(Tone.getContext().rawContext.destination);

            // Start de bron en voer FFT uit
            source.start(0);

            // Wacht tot de bron is afgespeeld
            await new Promise((resolve) => {
                source.onended = resolve;
            });

            analyser.getFloatFrequencyData(dataArray);

            // Maak frequentie/amplitude-paren
            const sampleRate = audioBuffer.sampleRate;
            const frequencies = Array.from({ length: bufferLength }, (_, i) => (i * sampleRate) / analyser.fftSize);
            const results = frequencies.map((frequency, i) => ({
                frequency,
                amplitude: dataArray[i],
            }));

            // Sorteer en pak de top 10 frequenties
            const top10 = results
                .filter(({ amplitude }) => amplitude > -100) // Filter ruis
                .sort((a, b) => b.amplitude - a.amplitude)
                .slice(0, 10);

            console.log('Top 10 frequenties:', top10);
            return top10;
        } catch (error) {
            console.error('Fout bij audio-analyse:', error);
            return [];
        }
    }
}

export const audioEngine = new AudioEngine();
