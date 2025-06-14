const { loadMocksFromFile, saveMocksToFile } = require('./storage');
const PostgresStorage = require('./postgresStorage');
const MongoStorage = require('./mongoStorage');
const logger = require('../server/logger');

// Storage type configuration
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'file'; // file | postgres | mongodb
const USE_DB = process.env.USE_DB === 'true'; // Legacy support

// Storage instances
let postgresStorage = null;
let mongoStorage = null;

function getStorageType() {
    // Legacy compatibility
    if (USE_DB && STORAGE_TYPE === 'file') {
        return 'postgres'; // Default to postgres for backward compatibility
    }
    return STORAGE_TYPE;
}

function getStorageInstance() {
    const storageType = getStorageType();
    logger.debug(`🔧 Storage strategy - Getting storage instance for type: ${storageType}`);
    
    switch (storageType) {
        case 'postgres':
        case 'postgresql':
            logger.debug('🐘 Storage strategy - Requesting PostgreSQL storage instance');
            if (!postgresStorage) {
                logger.info('🐘 Storage strategy - Creating new PostgreSQL storage instance');
                postgresStorage = new PostgresStorage();
            }
            logger.debug('🐘 Storage strategy - Returning PostgreSQL storage instance');
            return postgresStorage;
            
        case 'mongodb':
        case 'mongo':
            if (!mongoStorage) {
                mongoStorage = new MongoStorage();
            }
            return mongoStorage;
            
        case 'file':
        default:
            return null; // Use file-based storage
    }
}

async function loadMocks() {
    const storageType = getStorageType();
    
    try {
        if (storageType === 'file') {
            return loadMocksFromFile();
        } else {
            const storage = getStorageInstance();
            return await storage.loadMocks();
        }
    } catch (err) {
        logger.error(`❌ Failed to load mocks from ${storageType}:`, err.message);
        logger.warn('🔄 Falling back to file storage');
        return loadMocksFromFile();
    }
}

async function saveMocks(mocks) {
    const storageType = getStorageType();
    
    try {
        if (storageType === 'file') {
            return saveMocksToFile(mocks);
        } else {
            const storage = getStorageInstance();
            return await storage.saveMocks(mocks);
        }
    } catch (err) {
        logger.error(`❌ Failed to save mocks to ${storageType}:`, err.message);
        logger.warn('🔄 Falling back to file storage');
        return saveMocksToFile(mocks);
    }
}

async function addMock(mock) {
    const storageType = getStorageType();
    
    if (storageType === 'file') {
        // For file storage, we'll handle this at the route level
        throw new Error('addMock not supported for file storage - use saveMocks instead');
    }
    
    const storage = getStorageInstance();
    return await storage.addMock(mock);
}

async function updateMock(id, updatedMock) {
    const storageType = getStorageType();
    
    if (storageType === 'file') {
        // For file storage, we'll handle this at the route level
        throw new Error('updateMock not supported for file storage - use saveMocks instead');
    }
    
    const storage = getStorageInstance();
    return await storage.updateMock(id, updatedMock);
}

async function deleteMock(id) {
    const storageType = getStorageType();
    
    if (storageType === 'file') {
        // For file storage, we'll handle this at the route level
        throw new Error('deleteMock not supported for file storage - use saveMocks instead');
    }
    
    const storage = getStorageInstance();
    return await storage.deleteMock(id);
}

async function getMockById(id) {
    const storageType = getStorageType();
    
    if (storageType === 'file') {
        // For file storage, we'll handle this at the route level
        throw new Error('getMockById not supported for file storage');
    }
    
    const storage = getStorageInstance();
    return await storage.getMockById(id);
}

async function closeStorage() {
    const promises = [];
    
    if (postgresStorage) {
        promises.push(postgresStorage.close());
    }
    
    if (mongoStorage) {
        promises.push(mongoStorage.close());
    }
    
    await Promise.all(promises);
}

function getStorageInfo() {
    const storageType = getStorageType();
    return {
        type: storageType,
        legacy: USE_DB,
        supported: ['file', 'postgres', 'postgresql', 'mongodb', 'mongo'],
        current: storageType,
        description: {
            file: 'JSON file-based storage (default)',
            postgres: 'PostgreSQL database storage',
            mongodb: 'MongoDB database storage'
        }
    };
}

// Initialize storage on module load
(async () => {
    const storageType = getStorageType();
    if (storageType !== 'file') {
        try {
            const storage = getStorageInstance();
            await storage.initialize();
            logger.info(`✅ Storage initialized: ${storageType}`);
        } catch (err) {
            logger.error(`❌ Failed to initialize ${storageType} storage:`, err.message);
            logger.warn('⚠️ Will fall back to file storage if needed');
        }
    } else {
        logger.info('✅ Using file-based storage');
    }
})();

module.exports = { 
    loadMocks, 
    saveMocks, 
    addMock, 
    updateMock, 
    deleteMock, 
    getMockById, 
    closeStorage,
    getStorageInfo,
    getStorageType,
    getStorageInstance
};
