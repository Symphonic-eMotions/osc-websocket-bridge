const sliders = {}; // Object om sliders bij te houden per unieke OSC-stream

// Functie om een nieuwe slider toe te voegen
function createSlider(address) {
    const container = document.createElement('div');
    container.classList.add('flex', 'flex-col', 'space-y-2', 'bg-gray-700', 'p-4', 'rounded-md', 'shadow-md');

    const label = document.createElement('div');
    label.classList.add('text-sm', 'font-bold', 'text-gray-300');
    label.textContent = `Stream: ${address}`;
    container.appendChild(label);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.01'; // Hiermee kun je waarden in stappen van 0.01 hebben
    slider.value = '0';
    slider.classList.add('w-full', 'cursor-pointer', 'slider-thumb');
    container.appendChild(slider);

    // Voeg de slider toe aan de sliders-container in de HTML
    document.getElementById('sliders-container').appendChild(container);

    // Sla de slider op in het `sliders` object voor snelle toegang
    sliders[address] = slider;
}

// Functie om een sliderwaarde bij te werken op basis van inkomende OSC-berichten
function updateSlider(address, value) {
    if (sliders[address]) {
        sliders[address].value = value;
    } else {
        // Maak een nieuwe slider als het adres nog niet bestaat
        createSlider(address);
        sliders[address].value = value;
    }
}

// Exporteer functies en objecten
export { createSlider, updateSlider };