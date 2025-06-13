const mongoose = require('mongoose');
const logger = require('../server/logger');

// Mock schema definition
const mockSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    method: { type: String, required: true, index: true },
    path: { type: String, required: true, index: true },
    headers: { type: Object, default: {} },
    response: { type: Object, required: true },
    statusCode: { type: Number, default: 200 },
    delay: { type: Object, default: null },
    dynamic: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Create compound index for efficient lookups
mockSchema.index({ method: 1, path: 1 });
mockSchema.index({ headers: 1 });

// Update timestamp on save
mockSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

class MongoStorage {
    constructor() {
        this.Mock = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const mongoUrl = process.env.MONGODB_URL || 
            `mongodb://${process.env.MONGO_HOST || 'localhost'}:${process.env.MONGO_PORT || 27017}/${process.env.MONGO_DB || 'mock_server'}`;

        try {
            await mongoose.connect(mongoUrl, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            });

            this.Mock = mongoose.model('Mock', mockSchema);
            this.initialized = true;
            logger.info('🍃 MongoDB storage initialized successfully');

        } catch (err) {
            logger.error('❌ Failed to initialize MongoDB storage:', err.message);
            throw err;
        }
    }

    async loadMocks() {
        await this.initialize();
        
        try {
            const mocks = await this.Mock.find({}).sort({ createdAt: 1 }).lean();
            
            // Convert MongoDB documents to the expected format
            const formattedMocks = mocks.map(mock => ({
                id: mock.id,
                name: mock.name,
                method: mock.method,
                path: mock.path,
                headers: mock.headers || {},
                response: mock.response,
                statusCode: mock.statusCode,
                delay: mock.delay,
                dynamic: mock.dynamic,
                createdAt: mock.createdAt,
                updatedAt: mock.updatedAt
            }));

            logger.info(`🍃 Loaded ${formattedMocks.length} mocks from MongoDB`);
            return formattedMocks;

        } catch (err) {
            logger.error('❌ Failed to load mocks from MongoDB:', err.message);
            throw err;
        }
    }

    async saveMocks(mocks) {
        await this.initialize();
        
        try {
            // Clear existing mocks
            await this.Mock.deleteMany({});

            // Insert all mocks
            if (mocks.length > 0) {
                const formattedMocks = mocks.map(mock => ({
                    id: mock.id,
                    name: mock.name,
                    method: mock.method,
                    path: mock.path,
                    headers: mock.headers || {},
                    response: mock.response,
                    statusCode: mock.statusCode || 200,
                    delay: mock.delay,
                    dynamic: mock.dynamic !== false,
                    createdAt: mock.createdAt || new Date(),
                    updatedAt: new Date()
                }));

                await this.Mock.insertMany(formattedMocks);
            }

            logger.info(`🍃 Saved ${mocks.length} mocks to MongoDB`);

        } catch (err) {
            logger.error('❌ Failed to save mocks to MongoDB:', err.message);
            throw err;
        }
    }

    async addMock(mock) {
        await this.initialize();
        
        try {
            const newMock = new this.Mock({
                id: mock.id,
                name: mock.name,
                method: mock.method,
                path: mock.path,
                headers: mock.headers || {},
                response: mock.response,
                statusCode: mock.statusCode || 200,
                delay: mock.delay,
                dynamic: mock.dynamic !== false
            });

            await newMock.save();
            logger.info(`🍃 Added mock "${mock.name}" to MongoDB`);
            return mock;

        } catch (err) {
            logger.error('❌ Failed to add mock to MongoDB:', err.message);
            throw err;
        }
    }

    async updateMock(id, updatedMock) {
        await this.initialize();
        
        try {
            const result = await this.Mock.findOneAndUpdate(
                { id: id },
                {
                    name: updatedMock.name,
                    method: updatedMock.method,
                    path: updatedMock.path,
                    headers: updatedMock.headers || {},
                    response: updatedMock.response,
                    statusCode: updatedMock.statusCode || 200,
                    delay: updatedMock.delay,
                    dynamic: updatedMock.dynamic !== false,
                    updatedAt: new Date()
                },
                { new: true }
            );

            if (!result) {
                throw new Error(`Mock with id ${id} not found`);
            }

            logger.info(`🍃 Updated mock "${updatedMock.name}" in MongoDB`);
            return updatedMock;

        } catch (err) {
            logger.error('❌ Failed to update mock in MongoDB:', err.message);
            throw err;
        }
    }

    async deleteMock(id) {
        await this.initialize();
        
        try {
            const deletedMock = await this.Mock.findOneAndDelete({ id: id });

            if (!deletedMock) {
                throw new Error(`Mock with id ${id} not found`);
            }

            logger.info(`🍃 Deleted mock "${deletedMock.name}" from MongoDB`);
            return deletedMock;

        } catch (err) {
            logger.error('❌ Failed to delete mock from MongoDB:', err.message);
            throw err;
        }
    }

    async getMockById(id) {
        await this.initialize();
        
        try {
            const mock = await this.Mock.findOne({ id: id }).lean();

            if (!mock) {
                return null;
            }

            return {
                id: mock.id,
                name: mock.name,
                method: mock.method,
                path: mock.path,
                headers: mock.headers || {},
                response: mock.response,
                statusCode: mock.statusCode,
                delay: mock.delay,
                dynamic: mock.dynamic,
                createdAt: mock.createdAt,
                updatedAt: mock.updatedAt
            };

        } catch (err) {
            logger.error('❌ Failed to get mock from MongoDB:', err.message);
            throw err;
        }
    }

    async close() {
        if (this.initialized) {
            await mongoose.connection.close();
            logger.info('🍃 MongoDB connection closed');
        }
    }
}

module.exports = MongoStorage;
