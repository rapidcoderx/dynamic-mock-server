require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { applySecurity } = require('./security');
const logger = require('./logger');
const { router: mockRoutes, mockStore } = require('./routes/mockRoutes');
const { findMock } = require('../utils/matcher');
const { loadMocks } = require('../utils/storageStrategy');

const app = express();
const PORT = process.env.PORT || 8080;
const API_PREFIX = (process.env.API_PREFIX || '/api').replace(/\/$/, '');

logger.info(`Starting server with API prefix: ${API_PREFIX}`);
app.use(express.json());
app.use(cors());
applySecurity(app);

mockStore.push(...loadMocks());

// Serve static files under the prefix
app.use(`${API_PREFIX}/`, express.static(path.join(__dirname, '..', 'public')));

// Health check endpoint
app.get(`${API_PREFIX}/health`, (req, res) => {
    logger.info('✅ Health check passed');
    res.status(200).json({ status: 'ok' });
});

app.use(`${API_PREFIX}/mocks`, mockRoutes);

app.get(`${API_PREFIX}/config`, (req, res) => {
    res.json({ apiPrefix: API_PREFIX });
});

// Mock matching middleware - use middleware instead of app.all('*')
app.use((req, res, next) => {
    const skipPaths = [
        `${API_PREFIX}/health`,
        `${API_PREFIX}/config`,
        `${API_PREFIX}/mocks`,
    ];

    if (skipPaths.some(p => req.path.startsWith(p))) return next();

    const mock = findMock({
        method: req.method,
        path: req.path,
        headers: req.headers
    }, mockStore);

    if (mock) {
        logger.info(`🎭 Matched mock for ${req.method} ${req.path}`);
        return res.status(mock.statusCode || 200).json(mock.response);
    } else {
        logger.warn(`❌ No mock found for ${req.method} ${req.path}`);
        return res.status(404).json({ error: 'No mock found for this request' });
    }
});

// Catch-all fallback to index.html (for UI refresh / direct hits)
app.use((req, res, next) => {
    if (req.path.startsWith(API_PREFIX + '/')) {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    } else {
        next();
    }
});

// Start server
app.listen(PORT, () => {
    logger.info(`🚀 Server running at http://localhost:${PORT}${API_PREFIX}/`);
});
