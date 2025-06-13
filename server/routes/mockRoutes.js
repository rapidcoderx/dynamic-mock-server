const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');
const { saveMocks } = require('../../utils/storageStrategy');
const { isUniqueMock, findMock } = require('../../utils/matcher');

const router = express.Router();
const mockStore = []; // In-memory store (can later be persisted or DB-backed)

// GET /mocks - List all mocks
router.get('/', (req, res) => {
    logger.info(`📦 Returning ${mockStore.length} mocks`);
    res.json(mockStore);
});

// POST /mocks - Register a new mock
router.post('/', (req, res) => {
    try {
        const { name, method, path, headers = {}, response, statusCode = 200 } = req.body;

        if (!name || !method || !path || !response) {
            logger.warn('❌ Missing required fields in mock registration');
            return res.status(400).json({ error: 'name, method, path, and response are required' });
        }

        const newMock = {
            id: uuidv4(),
            name,
            method: method.toUpperCase(),
            path,
            headers,
            response,
            statusCode
        };

        // Check for uniqueness
        if (!isUniqueMock(newMock, mockStore)) {
            logger.warn(`❌ Duplicate mock configuration: [${newMock.method}] ${newMock.path} with same headers`);
            return res.status(409).json({ 
                error: 'A mock with the same method, path, and headers already exists. Each mock must have a unique combination of method + path + headers.' 
            });
        }

        mockStore.push(newMock);
        saveMocks(mockStore);

        const headerInfo = Object.keys(newMock.headers).length > 0 
            ? ` with headers: ${JSON.stringify(newMock.headers)}`
            : '';
        logger.info(`✅ Registered mock [${newMock.method}] ${newMock.path}${headerInfo}`);
        res.status(201).json(newMock);
    } catch (err) {
        logger.error(`❌ Error registering mock: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /mocks/:id - Delete a mock by ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const index = mockStore.findIndex(mock => mock.id === id);
    
    if (index === -1) {
        logger.warn(`❌ Mock with ID ${id} not found for deletion`);
        return res.status(404).json({ error: 'Mock not found' });
    }
    
    const deletedMock = mockStore.splice(index, 1)[0];
    saveMocks(mockStore);
    
    logger.info(`🗑️ Deleted mock "${deletedMock.name}" [${deletedMock.method}] ${deletedMock.path}`);
    res.json({ message: 'Mock deleted successfully', deletedMock });
});

// GET /mocks/analyze - Analyze potential conflicts and duplicates
router.get('/analyze', (req, res) => {
    const conflicts = [];
    const pathMethodGroups = {};

    // Group mocks by path + method
    mockStore.forEach(mock => {
        const key = `${mock.method}:${mock.path}`;
        if (!pathMethodGroups[key]) {
            pathMethodGroups[key] = [];
        }
        pathMethodGroups[key].push(mock);
    });

    // Identify conflicts
    Object.entries(pathMethodGroups).forEach(([key, mocks]) => {
        if (mocks.length > 1) {
            const [method, path] = key.split(':');
            conflicts.push({
                method,
                path,
                count: mocks.length,
                mocks: mocks.map(m => ({
                    id: m.id,
                    name: m.name,
                    headers: m.headers,
                    hasHeaders: Object.keys(m.headers || {}).length > 0
                }))
            });
        }
    });

    logger.info(`📊 Mock analysis: ${mockStore.length} total mocks, ${conflicts.length} conflicts`);
    res.json({
        totalMocks: mockStore.length,
        conflicts: conflicts,
        summary: conflicts.length === 0 
            ? 'All mocks have unique path+method+headers combinations'
            : `Found ${conflicts.length} path+method combinations with multiple mocks (header-based routing required)`
    });
});

// POST /mocks/test - Test if a request would match any mock
router.post('/test', (req, res) => {
    const { method, path, headers = {} } = req.body;
    
    if (!method || !path) {
        return res.status(400).json({ error: 'method and path are required' });
    }

    const result = findMock({ method: method.toUpperCase(), path, headers }, mockStore);
    
    if (result.found) {
        const mock = result.mock;
        logger.info(`🧪 Test matched mock "${mock.name}" for ${method} ${path}`);
        res.json({
            matched: true,
            mock: {
                id: mock.id,
                name: mock.name,
                method: mock.method,
                path: mock.path,
                headers: mock.headers,
                response: mock.response,
                statusCode: mock.statusCode
            }
        });
    } else {
        logger.info(`🧪 Test found no match for ${method} ${path}`);
        res.status(result.statusCode).json({
            matched: false,
            ...result.response
        });
    }
});

// PUT /mocks/:id - Update an existing mock
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, method, path, headers = {}, response, statusCode = 200 } = req.body;

        if (!name || !method || !path || !response) {
            logger.warn('❌ Missing required fields in mock update');
            return res.status(400).json({ error: 'name, method, path, and response are required' });
        }

        const mockIndex = mockStore.findIndex(mock => mock.id === id);
        if (mockIndex === -1) {
            logger.warn(`❌ Mock with ID ${id} not found for update`);
            return res.status(404).json({ error: 'Mock not found' });
        }

        const updatedMock = {
            id,
            name,
            method: method.toUpperCase(),
            path,
            headers,
            response,
            statusCode
        };

        // Check for uniqueness (excluding the current mock)
        const otherMocks = mockStore.filter(mock => mock.id !== id);
        if (!isUniqueMock(updatedMock, otherMocks)) {
            logger.warn(`❌ Update would create duplicate mock configuration: [${updatedMock.method}] ${updatedMock.path} with same headers`);
            return res.status(409).json({ 
                error: 'A mock with the same method, path, and headers already exists. Each mock must have a unique combination of method + path + headers.' 
            });
        }

        const oldMock = mockStore[mockIndex];
        mockStore[mockIndex] = updatedMock;
        saveMocks(mockStore);

        const headerInfo = Object.keys(updatedMock.headers).length > 0 
            ? ` with headers: ${JSON.stringify(updatedMock.headers)}`
            : '';
        logger.info(`✅ Updated mock "${oldMock.name}" -> "${updatedMock.name}" [${updatedMock.method}] ${updatedMock.path}${headerInfo}`);
        res.json(updatedMock);
    } catch (err) {
        logger.error(`❌ Error updating mock: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = { router, mockStore };
