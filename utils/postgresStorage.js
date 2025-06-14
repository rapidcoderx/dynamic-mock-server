const { Pool } = require('pg');
const logger = require('../server/logger');
const { log } = require('winston');

class PostgresStorage {
    constructor() {
        this.pool = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) {
            logger.debug('🐘 PostgreSQL storage already initialized');
            return;
        }

        logger.info('🐘 Starting PostgreSQL storage initialization...');

        const config = {
            connectionString: process.env.DATABASE_URL || 
                `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'password'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'mock_server'}`,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        };

        logger.info('🐘 PostgreSQL config created:', {
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            user: process.env.POSTGRES_USER || 'postgres',
            database: process.env.POSTGRES_DB || 'mock_server',
            hasPassword: !!(process.env.POSTGRES_PASSWORD),
            connectionString: config.connectionString,
            ssl: config.ssl
        });

        this.pool = new Pool(config);
        logger.debug('🐘 PostgreSQL pool created');

        try {
            logger.debug('🐘 Testing PostgreSQL connection...');
            // Test connection
            const client = await this.pool.connect();
            logger.debug('🐘 PostgreSQL connection successful!');
            
            // Create table if it doesn't exist
            await client.query(`
                CREATE TABLE IF NOT EXISTS mocks (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    method VARCHAR(10) NOT NULL,
                    path TEXT NOT NULL,
                    headers JSONB DEFAULT '{}',
                    response JSONB NOT NULL,
                    status_code INTEGER DEFAULT 200,
                    delay JSONB DEFAULT NULL,
                    dynamic BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Create indexes for performance
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_mocks_method_path ON mocks(method, path);
                CREATE INDEX IF NOT EXISTS idx_mocks_headers ON mocks USING GIN(headers);
            `);
            logger.debug('🐘 Main mocks table and indexes created');

            // Create analytics tables
            logger.debug('🐘 Creating analytics tables...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS request_history (
                    id VARCHAR(255) PRIMARY KEY,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    method VARCHAR(10) NOT NULL,
                    path TEXT NOT NULL,
                    headers JSONB DEFAULT '{}',
                    query_params JSONB DEFAULT '{}',
                    body_size INTEGER DEFAULT 0,
                    user_agent TEXT,
                    ip_address INET,
                    mock_matched BOOLEAN DEFAULT FALSE,
                    mock_id VARCHAR(255),
                    mock_name VARCHAR(255),
                    response_time INTEGER,
                    status_code INTEGER,
                    response_size INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            logger.debug('🐘 request_history table created');

            await client.query(`
                CREATE TABLE IF NOT EXISTS mock_hits (
                    id SERIAL PRIMARY KEY,
                    mock_id VARCHAR(255) NOT NULL,
                    mock_name VARCHAR(255),
                    hit_count INTEGER DEFAULT 1,
                    last_hit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(mock_id)
                );
            `);
            logger.debug('🐘 mock_hits table created');

            await client.query(`
                CREATE TABLE IF NOT EXISTS daily_stats (
                    id SERIAL PRIMARY KEY,
                    date DATE NOT NULL,
                    total_requests INTEGER DEFAULT 0,
                    mock_hits INTEGER DEFAULT 0,
                    not_found_requests INTEGER DEFAULT 0,
                    average_response_time DECIMAL(10,2) DEFAULT 0,
                    response_times_sum BIGINT DEFAULT 0,
                    status_codes JSONB DEFAULT '{}',
                    top_paths JSONB DEFAULT '{}',
                    top_mocks JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(date)
                );
            `);
            logger.debug('🐘 daily_stats table created');

            // Create indexes for analytics performance
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_request_history_timestamp ON request_history(timestamp);
                CREATE INDEX IF NOT EXISTS idx_request_history_method ON request_history(method);
                CREATE INDEX IF NOT EXISTS idx_request_history_path ON request_history(path);
                CREATE INDEX IF NOT EXISTS idx_request_history_status ON request_history(status_code);
                CREATE INDEX IF NOT EXISTS idx_request_history_mock_id ON request_history(mock_id);
                CREATE INDEX IF NOT EXISTS idx_mock_hits_mock_id ON mock_hits(mock_id);
                CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
            `);
            logger.debug('🐘 Analytics indexes created');

            client.release();
            this.initialized = true;
            logger.info('🐘 PostgreSQL storage initialized successfully');

        } catch (err) {
            logger.error('❌ Failed to initialize PostgreSQL storage:', {
                message: err.message,
                code: err.code,
                detail: err.detail,
                hint: err.hint,
                position: err.position,
                internalPosition: err.internalPosition,
                internalQuery: err.internalQuery,
                where: err.where,
                schema: err.schema,
                table: err.table,
                column: err.column,
                dataType: err.dataType,
                constraint: err.constraint,
                file: err.file,
                line: err.line,
                routine: err.routine,
                stack: err.stack
            });
            throw err;
        }
    }

    async loadMocks() {
        await this.initialize();
        
        try {
            const result = await this.pool.query(`
                SELECT id, name, method, path, headers, response, status_code, delay, dynamic, created_at, updated_at
                FROM mocks
                ORDER BY created_at ASC
            `);

            const mocks = result.rows.map(row => ({
                id: row.id,
                name: row.name,
                method: row.method,
                path: row.path,
                headers: row.headers || {},
                response: row.response,
                statusCode: row.status_code,
                delay: row.delay,
                dynamic: row.dynamic,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));

            logger.info(`🐘 Loaded ${mocks.length} mocks from PostgreSQL`);
            return mocks;

        } catch (err) {
            logger.error('❌ Failed to load mocks from PostgreSQL:', err.message);
            throw err;
        }
    }

    async saveMocks(mocks) {
        await this.initialize();
        
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Clear existing mocks
            await client.query('DELETE FROM mocks');

            // Insert all mocks
            for (const mock of mocks) {
                await client.query(`
                    INSERT INTO mocks (id, name, method, path, headers, response, status_code, delay, dynamic)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    mock.id,
                    mock.name,
                    mock.method,
                    mock.path,
                    JSON.stringify(mock.headers || {}),
                    JSON.stringify(mock.response),
                    mock.statusCode || 200,
                    mock.delay ? JSON.stringify(mock.delay) : null,
                    mock.dynamic !== false
                ]);
            }

            await client.query('COMMIT');
            logger.info(`🐘 Saved ${mocks.length} mocks to PostgreSQL`);

        } catch (err) {
            await client.query('ROLLBACK');
            logger.error('❌ Failed to save mocks to PostgreSQL:', err.message);
            throw err;
        } finally {
            client.release();
        }
    }

    async addMock(mock) {
        await this.initialize();
        
        try {
            await this.pool.query(`
                INSERT INTO mocks (id, name, method, path, headers, response, status_code, delay, dynamic)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                mock.id,
                mock.name,
                mock.method,
                mock.path,
                JSON.stringify(mock.headers || {}),
                JSON.stringify(mock.response),
                mock.statusCode || 200,
                mock.delay ? JSON.stringify(mock.delay) : null,
                mock.dynamic !== false
            ]);

            logger.info(`🐘 Added mock "${mock.name}" to PostgreSQL`);
            return mock;

        } catch (err) {
            logger.error('❌ Failed to add mock to PostgreSQL:', err.message);
            throw err;
        }
    }

    async updateMock(id, updatedMock) {
        await this.initialize();
        
        try {
            const result = await this.pool.query(`
                UPDATE mocks 
                SET name = $1, method = $2, path = $3, headers = $4, response = $5, 
                    status_code = $6, delay = $7, dynamic = $8, updated_at = CURRENT_TIMESTAMP
                WHERE id = $9
                RETURNING *
            `, [
                updatedMock.name,
                updatedMock.method,
                updatedMock.path,
                JSON.stringify(updatedMock.headers || {}),
                JSON.stringify(updatedMock.response),
                updatedMock.statusCode || 200,
                updatedMock.delay ? JSON.stringify(updatedMock.delay) : null,
                updatedMock.dynamic !== false,
                id
            ]);

            if (result.rows.length === 0) {
                throw new Error(`Mock with id ${id} not found`);
            }

            logger.info(`🐘 Updated mock "${updatedMock.name}" in PostgreSQL`);
            return updatedMock;

        } catch (err) {
            logger.error('❌ Failed to update mock in PostgreSQL:', err.message);
            throw err;
        }
    }

    async deleteMock(id) {
        await this.initialize();
        
        try {
            const result = await this.pool.query(`
                DELETE FROM mocks WHERE id = $1 RETURNING *
            `, [id]);

            if (result.rows.length === 0) {
                throw new Error(`Mock with id ${id} not found`);
            }

            const deletedMock = result.rows[0];
            logger.info(`🐘 Deleted mock "${deletedMock.name}" from PostgreSQL`);
            return deletedMock;

        } catch (err) {
            logger.error('❌ Failed to delete mock from PostgreSQL:', err.message);
            throw err;
        }
    }

    async getMockById(id) {
        await this.initialize();
        
        try {
            const result = await this.pool.query(`
                SELECT id, name, method, path, headers, response, status_code, delay, dynamic, created_at, updated_at
                FROM mocks WHERE id = $1
            `, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                id: row.id,
                name: row.name,
                method: row.method,
                path: row.path,
                headers: row.headers || {},
                response: row.response,
                statusCode: row.status_code,
                delay: row.delay,
                dynamic: row.dynamic,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };

        } catch (err) {
            logger.error('❌ Failed to get mock from PostgreSQL:', err.message);
            throw err;
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            logger.info('🐘 PostgreSQL connection pool closed');
        }
    }

    // Analytics Methods
    async saveRequestHistory(requestData) {
        await this.initialize();
        
        try {
            logger.debug('📊 Saving request history to PostgreSQL:', {
                id: requestData.id,
                method: requestData.method,
                path: requestData.path,
                mockMatched: !!requestData.mockMatched,
                statusCode: requestData.statusCode
            });
            
            await this.pool.query(`
                INSERT INTO request_history (
                    id, timestamp, method, path, headers, query_params, body_size,
                    user_agent, ip_address, mock_matched, mock_id, mock_name,
                    response_time, status_code, response_size
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                ON CONFLICT (id) DO UPDATE SET
                    timestamp = EXCLUDED.timestamp,
                    response_time = EXCLUDED.response_time,
                    status_code = EXCLUDED.status_code,
                    response_size = EXCLUDED.response_size
            `, [
                requestData.id,
                requestData.timestamp,
                requestData.method,
                requestData.path,
                JSON.stringify(requestData.headers || {}),
                JSON.stringify(requestData.query || {}),
                requestData.bodySize || 0,
                requestData.userAgent,
                requestData.ip,
                requestData.mockMatched ? true : false,
                requestData.mockMatched ? requestData.mockMatched.id : null,
                requestData.mockMatched ? requestData.mockMatched.name : null,
                requestData.responseTime,
                requestData.statusCode,
                requestData.responseSize
            ]);
            
            logger.debug('✅ Request history saved to PostgreSQL successfully');

        } catch (err) {
            if (err.code === '23505') { // Unique violation error code
                logger.warn('⚠️ Duplicate request ID detected, but handled with ON CONFLICT:', {
                    requestId: requestData.id,
                    message: err.message
                });
            } else {
                logger.error('❌ Failed to save request history to PostgreSQL:', {
                    message: err.message,
                    code: err.code,
                    detail: err.detail,
                    requestId: requestData.id,
                    stack: err.stack
                });
                throw err;
            }
        }
    }

    async updateMockHits(mockId, mockName) {
        await this.initialize();
        
        try {
            await this.pool.query(`
                INSERT INTO mock_hits (mock_id, mock_name, hit_count, last_hit, updated_at) 
                VALUES ($1, $2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (mock_id) 
                DO UPDATE SET 
                    hit_count = mock_hits.hit_count + 1,
                    last_hit = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP,
                    mock_name = $2
            `, [mockId, mockName]);

        } catch (err) {
            logger.error('❌ Failed to update mock hits in PostgreSQL:', err.message);
            throw err;
        }
    }

    async updateDailyStats(requestData) {
        await this.initialize();
        
        const dateKey = requestData.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
        
        try {
            // Get existing daily stats
            const existingStats = await this.pool.query(`
                SELECT * FROM daily_stats WHERE date = $1
            `, [dateKey]);

            if (existingStats.rows.length === 0) {
                // Create new daily stats entry
                await this.pool.query(`
                    INSERT INTO daily_stats (
                        date, total_requests, mock_hits, not_found_requests,
                        response_times_sum, status_codes, top_paths, top_mocks
                    ) VALUES ($1, 1, $2, $3, $4, $5, $6, $7)
                `, [
                    dateKey,
                    requestData.mockMatched ? 1 : 0,
                    requestData.statusCode === 404 && !requestData.mockMatched ? 1 : 0,
                    requestData.responseTime || 0,
                    JSON.stringify({ [requestData.statusCode]: 1 }),
                    JSON.stringify({ [requestData.path]: 1 }),
                    requestData.mockMatched ? JSON.stringify({ [requestData.mockMatched.id]: 1 }) : '{}'
                ]);
            } else {
                // Update existing stats
                const stats = existingStats.rows[0];
                const newTotalRequests = stats.total_requests + 1;
                const newMockHits = stats.mock_hits + (requestData.mockMatched ? 1 : 0);
                const newNotFoundRequests = stats.not_found_requests + (requestData.statusCode === 404 && !requestData.mockMatched ? 1 : 0);
                const newResponseTimesSum = stats.response_times_sum + (requestData.responseTime || 0);
                const newAverageResponseTime = newResponseTimesSum / newTotalRequests;

                // Update status codes
                const statusCodes = stats.status_codes || {};
                statusCodes[requestData.statusCode] = (statusCodes[requestData.statusCode] || 0) + 1;

                // Update top paths
                const topPaths = stats.top_paths || {};
                topPaths[requestData.path] = (topPaths[requestData.path] || 0) + 1;

                // Update top mocks
                const topMocks = stats.top_mocks || {};
                if (requestData.mockMatched) {
                    topMocks[requestData.mockMatched.id] = (topMocks[requestData.mockMatched.id] || 0) + 1;
                }

                await this.pool.query(`
                    UPDATE daily_stats SET
                        total_requests = $2,
                        mock_hits = $3,
                        not_found_requests = $4,
                        average_response_time = $5,
                        response_times_sum = $6,
                        status_codes = $7,
                        top_paths = $8,
                        top_mocks = $9,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE date = $1
                `, [
                    dateKey,
                    newTotalRequests,
                    newMockHits,
                    newNotFoundRequests,
                    newAverageResponseTime,
                    newResponseTimesSum,
                    JSON.stringify(statusCodes),
                    JSON.stringify(topPaths),
                    JSON.stringify(topMocks)
                ]);
            }

        } catch (err) {
            logger.error('❌ Failed to update daily stats in PostgreSQL:', err.message);
            throw err;
        }
    }

    async getAnalyticsSummary() {
        await this.initialize();
        
        try {
            const now = new Date();
            const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Get total counts
            const totalRequests = await this.pool.query(`
                SELECT COUNT(*) as count FROM request_history
            `);

            const recentRequests = await this.pool.query(`
                SELECT COUNT(*) as count FROM request_history WHERE timestamp >= $1
            `, [last24Hours]);

            const weeklyRequests = await this.pool.query(`
                SELECT COUNT(*) as count FROM request_history WHERE timestamp >= $1
            `, [last7Days]);

            // Get mock hits
            const mockHits = await this.pool.query(`
                SELECT SUM(hit_count) as total_hits, COUNT(*) as unique_mocks FROM mock_hits
            `);

            // Get response time stats (last 24 hours)
            const responseTimeStats = await this.pool.query(`
                SELECT 
                    AVG(response_time) as avg_response_time,
                    MAX(response_time) as max_response_time,
                    MIN(response_time) as min_response_time
                FROM request_history 
                WHERE timestamp >= $1 AND response_time IS NOT NULL
            `, [last24Hours]);

            // Get response time distribution
            const responseTimeDistribution = await this.pool.query(`
                SELECT 
                    COUNT(CASE WHEN response_time <= 10 THEN 1 END) as "0-10ms",
                    COUNT(CASE WHEN response_time > 10 AND response_time <= 50 THEN 1 END) as "11-50ms",
                    COUNT(CASE WHEN response_time > 50 AND response_time <= 100 THEN 1 END) as "51-100ms",
                    COUNT(CASE WHEN response_time > 100 AND response_time <= 500 THEN 1 END) as "101-500ms",
                    COUNT(CASE WHEN response_time > 500 THEN 1 END) as "501ms+"
                FROM request_history 
                WHERE timestamp >= $1 AND response_time IS NOT NULL
            `, [last24Hours]);

            // Get top mocks
            const topMocks = await this.pool.query(`
                SELECT mock_id, mock_name, hit_count 
                FROM mock_hits 
                ORDER BY hit_count DESC 
                LIMIT 10
            `);

            // Get status distribution (last 24 hours)
            const statusDistribution = await this.pool.query(`
                SELECT status_code, COUNT(*) as count 
                FROM request_history 
                WHERE timestamp >= $1 
                GROUP BY status_code 
                ORDER BY count DESC
            `, [last24Hours]);

            // Get daily stats (last 30 days)
            const dailyStats = await this.pool.query(`
                SELECT * FROM daily_stats 
                WHERE date >= CURRENT_DATE - INTERVAL '30 days'
                ORDER BY date DESC
            `);

            return {
                summary: {
                    totalRequests: parseInt(totalRequests.rows[0].count) || 0,
                    totalMockHits: parseInt(mockHits.rows[0].total_hits) || 0,
                    uniqueMocksHit: parseInt(mockHits.rows[0].unique_mocks) || 0,
                    recentRequests24h: parseInt(recentRequests.rows[0].count) || 0,
                    weeklyRequests: parseInt(weeklyRequests.rows[0].count) || 0
                },
                performance: {
                    averageResponseTime: Math.round(parseFloat(responseTimeStats.rows[0].avg_response_time) || 0),
                    maxResponseTime: parseInt(responseTimeStats.rows[0].max_response_time) || 0,
                    minResponseTime: parseInt(responseTimeStats.rows[0].min_response_time) || 0,
                    responseTimeDistribution: responseTimeDistribution.rows[0] || {}
                },
                topMocks: topMocks.rows.map(row => ({
                    mockId: row.mock_id,
                    mockName: row.mock_name,
                    count: row.hit_count
                })),
                statusDistribution: statusDistribution.rows.reduce((acc, row) => {
                    acc[row.status_code] = parseInt(row.count);
                    return acc;
                }, {}),
                dailyStats: dailyStats.rows.map(row => ({
                    date: row.date,
                    totalRequests: row.total_requests,
                    mockHits: row.mock_hits,
                    notFoundRequests: row.not_found_requests,
                    averageResponseTime: parseFloat(row.average_response_time),
                    statusCodes: row.status_codes || {},
                    topPaths: row.top_paths || {},
                    topMocks: row.top_mocks || {}
                }))
            };

        } catch (err) {
            logger.error('❌ Failed to get analytics summary from PostgreSQL:', err.message);
            throw err;
        }
    }

    async getRequestHistory(filters = {}) {
        await this.initialize();
        
        try {
            let whereConditions = [];
            let queryParams = [];
            let paramIndex = 1;

            // Build WHERE conditions based on filters
            if (filters.startDate) {
                whereConditions.push(`timestamp >= $${paramIndex}`);
                queryParams.push(new Date(filters.startDate));
                paramIndex++;
            }

            if (filters.endDate) {
                whereConditions.push(`timestamp <= $${paramIndex}`);
                queryParams.push(new Date(filters.endDate));
                paramIndex++;
            }

            if (filters.method) {
                whereConditions.push(`method = $${paramIndex}`);
                queryParams.push(filters.method.toUpperCase());
                paramIndex++;
            }

            if (filters.path) {
                whereConditions.push(`path ILIKE $${paramIndex}`);
                queryParams.push(`%${filters.path}%`);
                paramIndex++;
            }

            if (filters.statusCode) {
                whereConditions.push(`status_code = $${paramIndex}`);
                queryParams.push(parseInt(filters.statusCode));
                paramIndex++;
            }

            if (filters.mockId) {
                whereConditions.push(`mock_id = $${paramIndex}`);
                queryParams.push(filters.mockId);
                paramIndex++;
            }

            if (filters.search) {
                whereConditions.push(`(path ILIKE $${paramIndex} OR method ILIKE $${paramIndex + 1} OR mock_name ILIKE $${paramIndex + 2})`);
                queryParams.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
                paramIndex += 3;
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM request_history ${whereClause}`;
            const countResult = await this.pool.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);

            // Apply pagination
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 50;
            const offset = (page - 1) * limit;

            // Get paginated results
            const dataQuery = `
                SELECT * FROM request_history 
                ${whereClause} 
                ORDER BY timestamp DESC 
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;
            queryParams.push(limit, offset);

            const dataResult = await this.pool.query(dataQuery, queryParams);

            const requests = dataResult.rows.map(row => ({
                id: row.id,
                timestamp: row.timestamp,
                method: row.method,
                path: row.path,
                headers: row.headers || {},
                query: row.query_params || {},
                userAgent: row.user_agent,
                ip: row.ip_address,
                mockMatched: row.mock_matched ? {
                    id: row.mock_id,
                    name: row.mock_name
                } : null,
                responseTime: row.response_time,
                statusCode: row.status_code,
                responseSize: row.response_size
            }));

            return {
                requests,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (err) {
            logger.error('❌ Failed to get request history from PostgreSQL:', err.message);
            throw err;
        }
    }

    async clearAnalytics() {
        await this.initialize();
        
        try {
            await this.pool.query('DELETE FROM request_history');
            await this.pool.query('DELETE FROM mock_hits');
            await this.pool.query('DELETE FROM daily_stats');
            logger.info('🐘 Cleared all analytics data from PostgreSQL');

        } catch (err) {
            logger.error('❌ Failed to clear analytics data from PostgreSQL:', err.message);
            throw err;
        }
    }
}

module.exports = PostgresStorage;
