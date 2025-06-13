const helmet = require('helmet');
const logger = require('./logger');

function applySecurity(app) {
    if (process.env.ENABLE_SECURITY === 'true') {
        app.use(helmet());
        logger.info('🔐 Security middleware enabled');
    } else {
        logger.warn('⚠️ Security middleware DISABLED (dev mode)');
    }
}

module.exports = { applySecurity };
