const { Pool } = require('pg');
const logger = require('../server/logger');

class PostgresStorage {
    constructor() {
        this.pool = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const config = {
            connectionString: process.env.DATABASE_URL || 
                `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'password'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'mock_server'}`,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        };

        this.pool = new Pool(config);

        try {
            // Test connection
            const client = await this.pool.connect();
            
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

            client.release();
            this.initialized = true;
            logger.info('🐘 PostgreSQL storage initialized successfully');

        } catch (err) {
            logger.error('❌ Failed to initialize PostgreSQL storage:', err.message);
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
}

module.exports = PostgresStorage;
