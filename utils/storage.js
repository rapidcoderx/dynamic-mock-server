const fs = require('fs');
const path = require('path');
const logger = require('../server/logger');

const filePath = path.join(__dirname, '..', 'mocks', 'mock-config.json');

function loadMocksFromFile() {
    if (!fs.existsSync(filePath)) return [];

    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        logger.info(`📂 Loaded ${data.length} mocks from file`);
        return Array.isArray(data) ? data : [];
    } catch (err) {
        logger.error('❌ Failed to load mocks from file:', err.message);
        return [];
    }
}

function saveMocksToFile(mocks) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(mocks, null, 2), 'utf8');
        logger.info(`💾 Saved ${mocks.length} mocks to file`);
    } catch (err) {
        logger.error('❌ Failed to save mocks to file:', err.message);
    }
}

module.exports = { loadMocksFromFile, saveMocksToFile };
