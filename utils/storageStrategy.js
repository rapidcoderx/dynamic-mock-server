const { loadMocksFromFile, saveMocksToFile } = require('./storage');

const USE_DB = process.env.USE_DB === 'true'; // Default is false

function loadMocks() {
    if (USE_DB) {
        throw new Error('DB storage not yet implemented');
        // return loadMocksFromDB();
    } else {
        return loadMocksFromFile();
    }
}

function saveMocks(mocks) {
    if (USE_DB) {
        throw new Error('DB storage not yet implemented');
        // return saveMocksToDB(mocks);
    } else {
        return saveMocksToFile(mocks);
    }
}

module.exports = { loadMocks, saveMocks };
