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

        // this.gainNode = new Tone.Gain(1).toDestination();
        this.limiter = new Tone.Limiter(-5).toDestination(); // Limiteer het signaal tot -1 dB
        this.gainNode = new Tone.Gain(1).connect(this.limiter);
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
        const amplitudeLFOs = [];
        const frequencyLFOs = [];

        harmonics.forEach(({ frequency, normalizedAmplitude }) => {
            // Maak een oscillator voor elke harmonische
            const oscillator = new Tone.Oscillator({
                frequency: frequency, // Frequentie uit FFT
                type: 'sine',
            }).start();

            // Volume-instelling
            const volume = new Tone.Volume(-Infinity).connect(this.gainNode);
            oscillator.connect(volume);

            // Amplitude-LFO
            const amplitudeLFO = new Tone.LFO({
                frequency: 0.1 + Math.random() * 0.1, // Lichte variatie in frequentie
                min: 0,
                max: normalizedAmplitude, // Max amplitude
            }).start();
            amplitudeLFO.connect(volume.volume); // Correct verbinden

            // Frequentie-LFO
            const frequencyLFO = new Tone.LFO({
                frequency: 0.1 + Math.random() * 0.1, // Lichte variatie in frequentie
                min: frequency - 10,
                max: frequency + 10, // Frequentiemodulatie bereik
            }).start();
            frequencyLFO.connect(oscillator.frequency); // Correct verbinden

            oscillators.push(oscillator);
            volumes.push(volume);
            amplitudeLFOs.push(amplitudeLFO);
            frequencyLFOs.push(frequencyLFO);
        });

        this.nodes[address] = {
            oscillators,
            volumes,
            harmonics,
            lfos: {
                amplitudeLFOs,
                frequencyLFOs,
            },
        };

        console.log(`Oscillators voor ${address} aangemaakt met ${harmonics.length} harmonischen.`);
    }


    updateOscillatorsForHarmonics(address, value, smoothingFactor = 0.1) {
        const data = this.nodes[address];
        if (!data) {
            console.warn(`Geen oscillators gevonden voor ${address}.`);
            return;
        }

        // De inkomende waarde normaliseren (verwacht bereik: 0-1)
        const normalizedValue = Math.max(0, Math.min(1, value));
        const totalHarmonics = data.volumes.length; // Aantal oscillatoren
        const scalingFactor = 1 / Math.sqrt(totalHarmonics); // Verminder volume proportioneel

        // Update amplitudes van oscillatoren op basis van FFT-verhoudingen
        data.volumes.forEach((volume, index) => {
            // Originele FFT-amplitudeverhouding voor deze harmonische
            const originalAmplitude = data.harmonics[index].normalizedAmplitude;

            // Nieuwe doelamplitude op basis van de FFT-verhouding en de genormaliseerde waarde
            const targetAmplitude = normalizedValue * originalAmplitude * scalingFactor; // Schalen

            // Huidige amplitude van het volume
            const currentAmplitude = Tone.dbToGain(volume.volume.value);

            // Smoothing toepassen
            const smoothedAmplitude = currentAmplitude + smoothingFactor * (targetAmplitude - currentAmplitude);

            // Zet het nieuwe volume
            volume.volume.value = Tone.gainToDb(smoothedAmplitude);
        });

        console.log(`Harmonics voor ${address} geüpdatet met waarde: ${normalizedValue}`);
    }

    updateLFOs(address, lfoType, sliderValue) {
        const data = this.nodes[address];
        if (!data || !data.lfos) {
            console.warn(`Geen LFO's gevonden voor ${address}.`);
            return;
        }

        const lfos = lfoType === 'amplitude' ? data.lfos.amplitudeLFOs : data.lfos.frequencyLFOs;

        lfos.forEach((lfo) => {
            const depth = sliderValue; // Gebruik sliderwaarde direct als diepte
            if (lfoType === 'amplitude') {
                lfo.min = 0;
                lfo.max = depth; // Amplitude diepte
            } else if (lfoType === 'frequency') {
                lfo.frequency.value = depth * 10; // Frequentie diepte
            }
        });

        console.log(`LFO's voor ${address} geüpdatet: ${lfoType}, diepte: ${sliderValue}`);
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

            // Bepaal het karakteristieke segment (bijvoorbeeld na 20% en vóór 80% van de sample)
            const startSegment = Math.floor(channelData.length * 0.2);
            const endSegment = Math.floor(channelData.length * 0.8);
            const segmentLength = endSegment - startSegment;

            // Selecteer alleen het karakteristieke deel van de audio
            const middleSegment = channelData.slice(startSegment, endSegment);

            // Buffer om gemiddelde amplitudes te berekenen
            const frequencyAmplitudes = new Map(); // { frequency: { totalAmplitude, count } }

            // Itereer over het geselecteerde segment in blokken van fftSize
            for (let start = 0; start < segmentLength; start += fftSize) {
                const segment = middleSegment.slice(start, start + fftSize);

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

                // Bereken gemiddelde amplitude per frequentie
                frequencyData.forEach((amplitude, index) => {
                    const frequency = frequencies[index];

                    if (!frequencyAmplitudes.has(frequency)) {
                        frequencyAmplitudes.set(frequency, { totalAmplitude: 0, count: 0 });
                    }

                    const freqData = frequencyAmplitudes.get(frequency);
                    freqData.totalAmplitude += amplitude;
                    freqData.count += 1;
                });
            }

            // Bereken gemiddelde amplitude per frequentie
            const averagedFrequencies = Array.from(frequencyAmplitudes).map(([frequency, { totalAmplitude, count }]) => {
                const averageAmplitude = totalAmplitude / count;
                return {
                    frequency,
                    normalizedAmplitude: averageAmplitude / 255, // Normaliseer naar (0-1)
                };
            });

            // Introduceer willekeur in de selectie
            const topFreqAmount = 10; // Aantal gewenste frequenties
            const randomizedFrequencies = averagedFrequencies
                .filter((f) => f.normalizedAmplitude > 0.01) // Filter zwakke frequenties uit
                .sort((a, b) => b.normalizedAmplitude - a.normalizedAmplitude) // Sorteer op sterkte
                .map((item, index) => ({ ...item, randomScore: Math.random() * (1 / (index + 1)) })) // Voeg random score toe
                .sort((a, b) => b.randomScore - a.randomScore) // Sorteer opnieuw op random score
                .slice(0, topFreqAmount); // Selecteer de top x frequenties

            console.log('Geselecteerde frequenties met willekeur:', randomizedFrequencies);
            return randomizedFrequencies;
        } catch (error) {
            console.error('Fout bij audio-analyse:', error);
            return [];
        }
    }
}

export const audioEngine = new AudioEngine();
