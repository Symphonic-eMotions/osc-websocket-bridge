const fs = require('fs');
const path = require('path');

function getPages(directory) {
    const dirPath = path.join(__dirname, '../../public/pages');
    try {
        return fs.readdirSync(dirPath).filter(file => file.endsWith('.html'));
    } catch (err) {
        console.error(`Error reading pages directory: ${err}`);
        return [];
    }
}

module.exports = { getPages };
