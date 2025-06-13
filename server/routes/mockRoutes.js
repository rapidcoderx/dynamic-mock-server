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

// GET /mocks/export - Export all mocks as JSON
router.get('/export', (req, res) => {
    const exportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        totalMocks: mockStore.length,
        mocks: mockStore.map(mock => ({
            ...mock,
            // Add metadata for import validation
            exported: true
        }))
    };
    
    logger.info(`📤 Exporting ${mockStore.length} mocks`);
    res.json(exportData);
});

// POST /mocks/import - Import mocks from JSON
router.post('/import', (req, res) => {
    try {
        const { mocks, replaceExisting = false } = req.body;
        
        if (!mocks || !Array.isArray(mocks)) {
            return res.status(400).json({ error: 'Invalid import data: mocks array is required' });
        }
        
        const importedMocks = [];
        const errors = [];
        let duplicatesSkipped = 0;
        
        mocks.forEach((mockData, index) => {
            try {
                const { name, method, path, headers = {}, response, statusCode = 200 } = mockData;
                
                if (!name || !method || !path || !response) {
                    errors.push(`Mock ${index + 1}: Missing required fields`);
                    return;
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
                
                // Check for uniqueness unless replacing
                if (!replaceExisting && !isUniqueMock(newMock, mockStore)) {
                    duplicatesSkipped++;
                    return;
                }
                
                // If replacing existing, remove duplicates first
                if (replaceExisting) {
                    const existingIndex = mockStore.findIndex(existing => 
                        existing.method === newMock.method && 
                        existing.path === newMock.path &&
                        JSON.stringify(existing.headers) === JSON.stringify(newMock.headers)
                    );
                    if (existingIndex !== -1) {
                        mockStore.splice(existingIndex, 1);
                    }
                }
                
                mockStore.push(newMock);
                importedMocks.push(newMock);
                
            } catch (err) {
                errors.push(`Mock ${index + 1}: ${err.message}`);
            }
        });
        
        saveMocks(mockStore);
        
        logger.info(`📥 Imported ${importedMocks.length} mocks, ${duplicatesSkipped} duplicates skipped, ${errors.length} errors`);
        
        res.json({
            success: true,
            imported: importedMocks.length,
            duplicatesSkipped,
            errors,
            totalMocks: mockStore.length,
            importedMocks: importedMocks.map(m => ({ id: m.id, name: m.name, method: m.method, path: m.path }))
        });
        
    } catch (err) {
        logger.error(`❌ Error importing mocks: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /mocks/export/postman - Generate Postman collection
router.get('/export/postman', (req, res) => {
    try {
        const baseUrl = req.query.baseUrl || `http://localhost:${process.env.PORT || 8080}`;
        
        const collection = {
            info: {
                name: "Dynamic Mock Server Collection",
                description: "Auto-generated Postman collection from mock server",
                version: "1.0.0",
                schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            variable: [
                {
                    key: "baseUrl",
                    value: baseUrl,
                    type: "string"
                }
            ],
            item: mockStore.map(mock => {
                const request = {
                    name: mock.name,
                    request: {
                        method: mock.method,
                        header: Object.entries(mock.headers || {}).map(([key, value]) => ({
                            key,
                            value: value.toString(),
                            type: "text"
                        })),
                        url: {
                            raw: `{{baseUrl}}${mock.path}`,
                            host: ["{{baseUrl}}"],
                            path: mock.path.split('/').filter(Boolean)
                        }
                    },
                    response: [
                        {
                            name: "Example Response",
                            originalRequest: {
                                method: mock.method,
                                header: Object.entries(mock.headers || {}).map(([key, value]) => ({
                                    key,
                                    value: value.toString()
                                })),
                                url: {
                                    raw: `{{baseUrl}}${mock.path}`,
                                    host: ["{{baseUrl}}"],
                                    path: mock.path.split('/').filter(Boolean)
                                }
                            },
                            status: `${mock.statusCode || 200}`,
                            code: mock.statusCode || 200,
                            header: [
                                {
                                    key: "Content-Type",
                                    value: "application/json"
                                }
                            ],
                            body: JSON.stringify(mock.response, null, 2)
                        }
                    ]
                };
                
                // Add request body for POST/PUT methods
                if (['POST', 'PUT', 'PATCH'].includes(mock.method)) {
                    request.request.body = {
                        mode: "raw",
                        raw: JSON.stringify({
                            // Example request body
                            example: "Add your request body here"
                        }, null, 2),
                        options: {
                            raw: {
                                language: "json"
                            }
                        }
                    };
                }
                
                return request;
            })
        };
        
        logger.info(`📋 Generated Postman collection with ${mockStore.length} requests`);
        res.json(collection);
        
    } catch (err) {
        logger.error(`❌ Error generating Postman collection: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /mocks/export/httpie - Generate HTTPie commands
router.get('/export/httpie', (req, res) => {
    try {
        const baseUrl = req.query.baseUrl || `http://localhost:${process.env.PORT || 8080}`;
        
        const commands = mockStore.map(mock => {
            let command = `http ${mock.method}`;
            
            // Add URL
            command += ` ${baseUrl}${mock.path}`;
            
            // Add headers
            Object.entries(mock.headers || {}).forEach(([key, value]) => {
                command += ` ${key}:"${value}"`;
            });
            
            // Add request body for POST/PUT methods
            if (['POST', 'PUT', 'PATCH'].includes(mock.method)) {
                command += ` Content-Type:application/json`;
                command += ` example="Add your request data here"`;
            }
            
            return {
                name: mock.name,
                method: mock.method,
                path: mock.path,
                command: command,
                description: `Test ${mock.name} - Expected status: ${mock.statusCode || 200}`,
                expectedResponse: mock.response
            };
        });
        
        const script = {
            info: {
                title: "Dynamic Mock Server HTTPie Commands",
                description: "Auto-generated HTTPie commands for testing mock endpoints",
                version: "1.0.0",
                generated: new Date().toISOString()
            },
            baseUrl,
            totalCommands: commands.length,
            commands,
            usage: [
                "# Copy and paste these commands to test your mocks:",
                "# Install HTTPie: pip install httpie",
                "# Run individual commands or create a test script",
                "",
                "# Example usage:",
                "# " + (commands[0]?.command || "http GET http://localhost:8080/api/example"),
                "",
                "# For batch testing, save commands to a file and run them sequentially"
            ]
        };
        
        logger.info(`🔧 Generated ${commands.length} HTTPie commands`);
        res.json(script);
        
    } catch (err) {
        logger.error(`❌ Error generating HTTPie commands: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = { router, mockStore };
