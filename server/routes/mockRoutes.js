const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');
const { saveMocks } = require('../../utils/storageStrategy');

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

        mockStore.push(newMock);
        saveMocks(mockStore);

        logger.info(`✅ Registered mock [${newMock.method}] ${newMock.path}`);
        res.status(201).json(newMock);
    } catch (err) {
        logger.error(`❌ Error registering mock: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = { router, mockStore };
