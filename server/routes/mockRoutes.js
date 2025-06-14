const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');
const { saveMocks } = require('../../utils/storageStrategy');
const { isUniqueMock, findMock } = require('../../utils/matcher');
const dynamicResponse = require('../../utils/dynamicResponse');

const router = express.Router();
const mockStore = []; // In-memory store (can later be persisted or DB-backed)

/**
 * @swagger
 * tags:
 *   - name: Mocks
 *     description: Mock management operations
 *   - name: Analytics
 *     description: Analytics and monitoring
 *   - name: System
 *     description: System health and configuration
 */

/**
 * @swagger
 * /mocks:
 *   get:
 *     summary: List all registered mocks
 *     tags: [Mocks]
 *     description: Retrieve a list of all registered mock endpoints with their configurations
 *     responses:
 *       200:
 *         description: List of mocks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mock'
 *             example:
 *               - id: "mock_123"
 *                 name: "Get User Profile"
 *                 method: "GET"
 *                 path: "/users/:id"
 *                 headers: {"Authorization": "Bearer token"}
 *                 response: {"id": "{{faker.datatype.number}}", "name": "{{faker.person.fullName}}"}
 *                 statusCode: 200
 *                 dynamic: true
 */
// GET /mocks - List all mocks
router.get('/', (req, res) => {
    logger.info(`📦 Returning ${mockStore.length} mocks`);
    res.json(mockStore);
});

/**
 * @swagger
 * /mocks:
 *   post:
 *     summary: Register a new mock endpoint
 *     tags: [Mocks]
 *     description: Create a new mock endpoint with custom response, headers, and routing rules
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - method
 *               - path
 *               - response
 *             properties:
 *               name:
 *                 type: string
 *                 description: Human-readable name for the mock
 *                 example: "Get User Profile"
 *               method:
 *                 type: string
 *                 enum: [GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS]
 *                 description: HTTP method
 *                 example: "GET"
 *               path:
 *                 type: string
 *                 description: URL path pattern (supports :param syntax)
 *                 example: "/users/:id"
 *               headers:
 *                 type: object
 *                 description: Required headers for matching (optional)
 *                 example: {"Authorization": "Bearer token"}
 *               queryParams:
 *                 type: array
 *                 description: Query parameter matching rules (optional)
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       example: "status"
 *                     type:
 *                       type: string
 *                       enum: [equals, contains, starts_with, ends_with, regex, exists, not_exists]
 *                       example: "equals"
 *                     value:
 *                       type: string
 *                       example: "active"
 *                     required:
 *                       type: boolean
 *                       example: true
 *               response:
 *                 type: object
 *                 description: Response body (supports Faker.js placeholders)
 *                 example: {"id": "{{faker.datatype.number}}", "name": "{{faker.person.fullName}}"}
 *               statusCode:
 *                 type: integer
 *                 description: HTTP status code
 *                 default: 200
 *                 example: 200
 *               delay:
 *                 oneOf:
 *                   - type: integer
 *                     description: Fixed delay in milliseconds
 *                   - type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [random, network]
 *                       min:
 *                         type: integer
 *                       max:
 *                         type: integer
 *                 description: Response delay configuration
 *               dynamic:
 *                 type: boolean
 *                 description: Whether to process Faker.js placeholders
 *                 default: false
 *     responses:
 *       201:
 *         description: Mock created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mock registered successfully"
 *                 mock:
 *                   $ref: '#/components/schemas/Mock'
 *       400:
 *         description: Bad request - missing required fields or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "name, method, path, and response are required"
 *       409:
 *         description: Conflict - mock with same method/path/headers already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "A mock with the same method, path, and headers already exists"
 */
// POST /mocks - Register a new mock
router.post('/', (req, res) => {
    try {
        const { 
            name, 
            method, 
            path, 
            headers = {}, 
            queryParams = {},
            response, 
            statusCode = 200,
            delay = null,
            dynamic = false 
        } = req.body;

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
            queryParams,
            response,
            statusCode,
            delay,
            dynamic
        };

        // Check for uniqueness
        if (!isUniqueMock(newMock, mockStore)) {
            const conflictMsg = `[${newMock.method}] ${newMock.path} with same headers and query parameters`;
            logger.warn(`❌ Duplicate mock configuration: ${conflictMsg}`);
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

/**
 * @swagger
 * /mocks/{id}:
 *   delete:
 *     summary: Delete a mock endpoint
 *     tags: [Mocks]
 *     description: Remove a mock endpoint by its unique ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique identifier of the mock to delete
 *         schema:
 *           type: string
 *           example: "mock_123456"
 *     responses:
 *       200:
 *         description: Mock deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mock deleted successfully"
 *                 deletedMock:
 *                   $ref: '#/components/schemas/Mock'
 *       404:
 *         description: Mock not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Mock not found"
 */
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

/**
 * @swagger
 * /mocks/analyze:
 *   get:
 *     summary: Analyze potential conflicts and duplicates
 *     tags: [Mocks]
 *     description: Analyze registered mocks to identify potential conflicts, duplicates, and routing issues
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conflicts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: string
 *                       method:
 *                         type: string
 *                       mocks:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Mock'
 *                       severity:
 *                         type: string
 *                         enum: [high, medium, low]
 *                       reason:
 *                         type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalMocks:
 *                       type: integer
 *                     conflictCount:
 *                       type: integer
 *                     uniquePaths:
 *                       type: integer
 *                     methodDistribution:
 *                       type: object
 */
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
                    queryParams: m.queryParams,
                    hasHeaders: Object.keys(m.headers || {}).length > 0,
                    hasQueryParams: Object.keys(m.queryParams || {}).length > 0
                }))
            });
        }
    });

    logger.info(`📊 Mock analysis: ${mockStore.length} total mocks, ${conflicts.length} conflicts`);
    res.json({
        totalMocks: mockStore.length,
        conflicts: conflicts,
        summary: conflicts.length === 0 
            ? 'All mocks have unique path+method+headers+query combinations'
            : `Found ${conflicts.length} path+method combinations with multiple mocks (header or query parameter based routing required)`
    });
});

/**
 * @swagger
 * /mocks/test:
 *   post:
 *     summary: Test if a request would match any mock
 *     tags: [Mocks]
 *     description: Test whether a given request would match any registered mock without actually invoking it
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *               - path
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS]
 *                 example: "GET"
 *               path:
 *                 type: string
 *                 example: "/users/123"
 *               headers:
 *                 type: object
 *                 description: Request headers to test against
 *                 example: {"Authorization": "Bearer token"}
 *               query:
 *                 type: object
 *                 description: Query parameters to test against
 *                 example: {"status": "active"}
 *     responses:
 *       200:
 *         description: Test completed - check 'matched' field for result
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     matched:
 *                       type: boolean
 *                       example: true
 *                     mock:
 *                       $ref: '#/components/schemas/Mock'
 *                 - type: object
 *                   properties:
 *                     matched:
 *                       type: boolean
 *                       example: false
 *                     error:
 *                       type: string
 *                       example: "No mock found"
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /mocks/test - Test if a request would match any mock
router.post('/test', (req, res) => {
    const { method, path, headers = {}, query = {} } = req.body;
    
    if (!method || !path) {
        return res.status(400).json({ error: 'method and path are required' });
    }

    const result = findMock({ method: method.toUpperCase(), path, headers, query }, mockStore);
    
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
                queryParams: mock.queryParams,
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

/**
 * @swagger
 * /mocks/{id}:
 *   put:
 *     summary: Update an existing mock endpoint
 *     tags: [Mocks]
 *     description: Update all properties of an existing mock endpoint
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique identifier of the mock to update
 *         schema:
 *           type: string
 *           example: "mock_123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - method
 *               - path
 *               - response
 *             properties:
 *               name:
 *                 type: string
 *                 description: Human-readable name for the mock
 *                 example: "Updated User Profile"
 *               method:
 *                 type: string
 *                 enum: [GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS]
 *                 description: HTTP method
 *                 example: "GET"
 *               path:
 *                 type: string
 *                 description: URL path pattern
 *                 example: "/users/:id"
 *               headers:
 *                 type: object
 *                 description: Required headers for matching
 *                 example: {"Authorization": "Bearer token"}
 *               queryParams:
 *                 type: array
 *                 description: Query parameter matching rules
 *               response:
 *                 type: object
 *                 description: Response body
 *               statusCode:
 *                 type: integer
 *                 description: HTTP status code
 *                 default: 200
 *               delay:
 *                 description: Response delay configuration
 *               dynamic:
 *                 type: boolean
 *                 description: Whether to process Faker.js placeholders
 *     responses:
 *       200:
 *         description: Mock updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mock updated successfully"
 *                 mock:
 *                   $ref: '#/components/schemas/Mock'
 *       404:
 *         description: Mock not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUT /mocks/:id - Update an existing mock
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, 
            method, 
            path, 
            headers = {}, 
            queryParams = {},
            response, 
            statusCode = 200,
            delay = null,
            dynamic = false 
        } = req.body;

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
            queryParams,
            response,
            statusCode,
            delay,
            dynamic
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

/**
 * @swagger
 * /mocks/export:
 *   get:
 *     summary: Export all mocks as JSON
 *     tags: [Mocks]
 *     description: Export all registered mocks in a portable JSON format for backup or sharing
 *     responses:
 *       200:
 *         description: Mocks exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 totalMocks:
 *                   type: integer
 *                   example: 25
 *                 mocks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Mock'
 */
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

/**
 * @swagger
 * /mocks/import:
 *   post:
 *     summary: Import mocks from JSON
 *     tags: [Mocks]
 *     description: Import multiple mocks from a JSON payload, with options to replace existing mocks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mocks
 *             properties:
 *               mocks:
 *                 type: array
 *                 description: Array of mock objects to import
 *                 items:
 *                   $ref: '#/components/schemas/Mock'
 *               replaceExisting:
 *                 type: boolean
 *                 description: Whether to replace existing mocks with the same method/path/headers
 *                 default: false
 *                 example: false
 *     responses:
 *       200:
 *         description: Import completed (may include partial success)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Import completed"
 *                 imported:
 *                   type: integer
 *                   description: Number of mocks successfully imported
 *                   example: 15
 *                 duplicatesSkipped:
 *                   type: integer
 *                   description: Number of duplicates skipped
 *                   example: 2
 *                 errors:
 *                   type: array
 *                   description: List of validation errors encountered
 *                   items:
 *                     type: object
 *                     properties:
 *                       index:
 *                         type: integer
 *                       error:
 *                         type: string
 *       400:
 *         description: Bad request - invalid import data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /mocks/export/postman:
 *   get:
 *     summary: Generate Postman collection
 *     tags: [Mocks]
 *     description: Generate a Postman collection file from all registered mocks for easy testing
 *     parameters:
 *       - name: baseUrl
 *         in: query
 *         description: Base URL for the generated requests
 *         schema:
 *           type: string
 *           default: 'http://localhost:8080'
 *           example: 'https://my-mock-server.com'
 *     responses:
 *       200:
 *         description: Postman collection generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Postman Collection v2.1 format
 *               properties:
 *                 info:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Dynamic Mock Server Collection"
 *                     description:
 *                       type: string
 *                     version:
 *                       type: string
 *                     schema:
 *                       type: string
 *                 item:
 *                   type: array
 *                   description: Collection requests
 */
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

/**
 * @swagger
 * /mocks/export/httpie:
 *   get:
 *     summary: Generate HTTPie commands
 *     tags: [Mocks]
 *     description: Generate HTTPie command line scripts to test all registered mocks
 *     parameters:
 *       - name: baseUrl
 *         in: query
 *         description: Base URL for the generated commands
 *         schema:
 *           type: string
 *           default: 'http://localhost:8080'
 *           example: 'https://my-mock-server.com'
 *     responses:
 *       200:
 *         description: HTTPie commands generated successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               description: Shell script with HTTPie commands
 *               example: |
 *                 #!/bin/bash
 *                 # HTTPie commands for Dynamic Mock Server
 *                 
 *                 # Get User Profile
 *                 http GET http://localhost:8080/users/123 Authorization:"Bearer token"
 */
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

/**
 * @swagger
 * /mocks/placeholders:
 *   get:
 *     summary: Get available dynamic placeholders
 *     tags: [Mocks]
 *     description: Retrieve a list of all available Faker.js placeholders and their categories for use in dynamic responses
 *     responses:
 *       200:
 *         description: Placeholders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: object
 *                   description: Placeholders organized by category
 *                   example:
 *                     person: ["{{faker.person.firstName}}", "{{faker.person.lastName}}"]
 *                     internet: ["{{faker.internet.email}}", "{{faker.internet.url}}"]
 *                 examples:
 *                   type: object
 *                   description: Example use cases
 *                   properties:
 *                     basicUser:
 *                       type: object
 *                       example:
 *                         id: "{{uuid}}"
 *                         name: "{{name}}"
 *                         email: "{{email}}"
 */
// GET /mocks/placeholders - Get available dynamic placeholders
router.get('/placeholders', (req, res) => {
    try {
        const placeholders = dynamicResponse.getAvailablePlaceholders();
        logger.info('📋 Returning available dynamic placeholders');
        res.json({
            categories: placeholders,
            examples: {
                basicUser: {
                    id: "{{uuid}}",
                    name: "{{name}}",
                    email: "{{email}}",
                    createdAt: "{{timestamp}}"
                },
                dynamicDelay: {
                    delay: { min: 100, max: 1000, type: "random" }
                },
                businessData: {
                    company: "{{company}}",
                    employees: "{{arrayOf:5:name}}",
                    revenue: "{{float:10000:50000}}"
                }
            },
            delayTypes: {
                fixed: "Fixed delay in milliseconds",
                random: "Random delay between min and max",
                network: "Simulate realistic network delays"
            }
        });
    } catch (err) {
        logger.error(`❌ Error getting placeholders: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /mocks/preview:
 *   post:
 *     summary: Preview dynamic response without saving
 *     tags: [Mocks]
 *     description: Test how a response template would look with dynamic values processed, without creating or modifying any mocks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: object
 *                 description: Response template with placeholders
 *                 example:
 *                   id: "{{faker.datatype.number}}"
 *                   name: "{{faker.person.fullName}}"
 *                   email: "{{faker.internet.email}}"
 *               delay:
 *                 description: Optional delay configuration for testing
 *                 oneOf:
 *                   - type: integer
 *                   - type: object
 *     responses:
 *       200:
 *         description: Preview generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preview:
 *                   type: object
 *                   description: Processed response with dynamic values
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     generated:
 *                       type: string
 *                       format: date-time
 *                     dynamicValues:
 *                       type: boolean
 *                     processingTime:
 *                       type: integer
 *       400:
 *         description: Bad request - missing response template
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /mocks/preview - Preview dynamic response without saving
router.post('/preview', async (req, res) => {
    try {
        const { response, delay = null } = req.body;
        
        if (!response) {
            return res.status(400).json({ error: 'response is required for preview' });
        }
        
        const mockConfig = { response, delay, dynamic: true };
        const { response: processedResponse, metadata } = await dynamicResponse.processResponse(mockConfig, req);
        
        logger.info('👀 Generated response preview');
        res.json({
            original: response,
            processed: processedResponse,
            metadata,
            hasDynamicValues: dynamicResponse.hasDynamicValues(response)
        });
        
    } catch (err) {
        logger.error(`❌ Error generating preview: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = { router, mockStore };
