const { faker } = require('@faker-js/faker');

/**
 * Dynamic Response Generator
 * 
 * Supports:
 * - Response delays (simulate network latency)
 * - Dynamic value generation using Faker.js
 * - Template placeholders in responses
 * - Timestamp generation
 * - Random data injection
 */

class DynamicResponseGenerator {
    constructor() {
        // Set a seed for consistent testing if needed
        this.faker = faker;
        this.templateRegex = /\{\{([^}]+)\}\}/g;
    }

    /**
     * Process a mock response with dynamic values and delays
     * @param {Object} mock - The mock configuration
     * @param {Object} request - Express request object
     * @returns {Promise<Object>} - Processed response with delay
     */
    async processResponse(mock, request = {}) {
        const startTime = Date.now();
        
        // Apply response delay if configured
        await this.applyDelay(mock.delay);
        
        // Process dynamic values in response
        const processedResponse = this.processDynamicValues(mock.response, request);
        
        const processingTime = Date.now() - startTime;
        
        return {
            response: processedResponse,
            metadata: {
                processingTime,
                generated: new Date().toISOString(),
                dynamicValues: this.hasDynamicValues(mock.response)
            }
        };
    }

    /**
     * Apply response delay
     * @param {number|Object} delay - Delay configuration
     */
    async applyDelay(delay) {
        if (!delay) return;

        let delayMs = 0;

        if (typeof delay === 'number') {
            delayMs = delay;
        } else if (typeof delay === 'object') {
            const { min = 0, max = 1000, type = 'fixed' } = delay;
            
            switch (type) {
                case 'random':
                    delayMs = faker.number.int({ min, max });
                    break;
                case 'network':
                    // Simulate realistic network delays
                    delayMs = this.simulateNetworkDelay();
                    break;
                case 'fixed':
                default:
                    delayMs = min;
                    break;
            }
        }

        if (delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    /**
     * Simulate realistic network delays
     */
    simulateNetworkDelay() {
        const scenarios = [
            { weight: 70, delay: () => faker.number.int({ min: 50, max: 200 }) },   // Fast
            { weight: 20, delay: () => faker.number.int({ min: 200, max: 800 }) },  // Medium
            { weight: 8, delay: () => faker.number.int({ min: 800, max: 2000 }) },  // Slow
            { weight: 2, delay: () => faker.number.int({ min: 2000, max: 5000 }) }  // Very slow
        ];

        const random = faker.number.int({ min: 1, max: 100 });
        let cumulative = 0;

        for (const scenario of scenarios) {
            cumulative += scenario.weight;
            if (random <= cumulative) {
                return scenario.delay();
            }
        }

        return 100; // Fallback
    }

    /**
     * Process dynamic values in response using template placeholders
     * @param {any} response - Response object/string/array
     * @param {Object} request - Request context
     * @returns {any} - Processed response
     */
    processDynamicValues(response, request = {}) {
        if (typeof response === 'string') {
            return this.processString(response, request);
        } else if (Array.isArray(response)) {
            return response.map(item => this.processDynamicValues(item, request));
        } else if (response && typeof response === 'object') {
            const processed = {};
            for (const [key, value] of Object.entries(response)) {
                processed[key] = this.processDynamicValues(value, request);
            }
            return processed;
        }
        
        return response;
    }

    /**
     * Process string with template placeholders
     * @param {string} str - String to process
     * @param {Object} request - Request context
     * @returns {string} - Processed string
     */
    processString(str, request) {
        return str.replace(this.templateRegex, (match, placeholder) => {
            return this.generateValue(placeholder.trim(), request);
        });
    }

    /**
     * Generate dynamic values based on placeholder
     * @param {string} placeholder - The placeholder type
     * @param {Object} request - Request context
     * @returns {any} - Generated value
     */
    generateValue(placeholder, request) {
        const [type, ...params] = placeholder.split(':');
        
        switch (type.toLowerCase()) {
            // Time & Date
            case 'timestamp':
            case 'now':
                return new Date().toISOString();
            case 'date':
                return faker.date.recent().toISOString().split('T')[0];
            case 'time':
                return new Date().toTimeString().split(' ')[0];
            case 'unix':
                return Math.floor(Date.now() / 1000);
            
            // Person
            case 'name':
            case 'fullname':
                return faker.person.fullName();
            case 'firstname':
                return faker.person.firstName();
            case 'lastname':
                return faker.person.lastName();
            case 'email':
                return faker.internet.email();
            case 'phone':
                return faker.phone.number();
            case 'username':
                return faker.internet.userName();
            
            // Business
            case 'company':
                return faker.company.name();
            case 'jobTitle':
                return faker.person.jobTitle();
            case 'department':
                return faker.commerce.department();
            
            // Address
            case 'address':
                return faker.location.streetAddress();
            case 'city':
                return faker.location.city();
            case 'country':
                return faker.location.country();
            case 'zipcode':
                return faker.location.zipCode();
            
            // Numbers & IDs
            case 'id':
            case 'uuid':
                return faker.string.uuid();
            case 'number':
                const min = params[0] ? parseInt(params[0]) : 1;
                const max = params[1] ? parseInt(params[1]) : 1000;
                return faker.number.int({ min, max });
            case 'float':
                const minFloat = params[0] ? parseFloat(params[0]) : 0;
                const maxFloat = params[1] ? parseFloat(params[1]) : 100;
                return faker.number.float({ min: minFloat, max: maxFloat, fractionDigits: 2 });
            
            // Internet
            case 'url':
                return faker.internet.url();
            case 'domain':
                return faker.internet.domainName();
            case 'ip':
                return faker.internet.ip();
            case 'mac':
                return faker.internet.mac();
            
            // Text
            case 'word':
                return faker.lorem.word();
            case 'words':
                const wordCount = params[0] ? parseInt(params[0]) : 3;
                return faker.lorem.words(wordCount);
            case 'sentence':
                return faker.lorem.sentence();
            case 'paragraph':
                return faker.lorem.paragraph();
            case 'title':
                return faker.lorem.sentence(3);
            
            // Colors & Images
            case 'color':
                return faker.color.human();
            case 'image':
                const width = params[0] || 640;
                const height = params[1] || 480;
                return `https://picsum.photos/${width}/${height}`;
            case 'avatar':
                return faker.image.avatar();
            
            // Request context
            case 'requestId':
                return request.headers?.['x-request-id'] || faker.string.uuid();
            case 'userAgent':
                return request.headers?.['user-agent'] || faker.internet.userAgent();
            case 'requestPath':
                return request.path || '/unknown';
            case 'requestMethod':
                return request.method || 'GET';
            
            // Custom functions
            case 'oneOf':
                const options = params.join(':').split(',').map(s => s.trim());
                return faker.helpers.arrayElement(options);
            case 'boolean':
                return faker.datatype.boolean();
            case 'arrayOf':
                const count = params[0] ? parseInt(params[0]) : 3;
                const itemType = params[1] || 'word';
                return Array.from({ length: count }, () => 
                    this.generateValue(itemType, request)
                );
            
            default:
                // If unknown placeholder, return as-is or try as faker method
                try {
                    const parts = type.split('.');
                    let value = faker;
                    for (const part of parts) {
                        value = value[part];
                    }
                    if (typeof value === 'function') {
                        return value();
                    }
                } catch (e) {
                    // Return placeholder if can't resolve
                    return `{{${placeholder}}}`;
                }
                return `{{${placeholder}}}`;
        }
    }

    /**
     * Check if response contains dynamic values
     * @param {any} response - Response to check
     * @returns {boolean}
     */
    hasDynamicValues(response) {
        const str = JSON.stringify(response);
        return this.templateRegex.test(str);
    }

    /**
     * Get available placeholders for documentation
     * @returns {Object} - Categorized placeholders
     */
    getAvailablePlaceholders() {
        return {
            'Time & Date': [
                '{{timestamp}}', '{{now}}', '{{date}}', '{{time}}', '{{unix}}'
            ],
            'Person': [
                '{{name}}', '{{firstname}}', '{{lastname}}', '{{email}}', 
                '{{phone}}', '{{username}}'
            ],
            'Business': [
                '{{company}}', '{{jobTitle}}', '{{department}}'
            ],
            'Address': [
                '{{address}}', '{{city}}', '{{country}}', '{{zipcode}}'
            ],
            'Numbers & IDs': [
                '{{id}}', '{{uuid}}', '{{number}}', '{{number:1:100}}', 
                '{{float:0:10}}'
            ],
            'Internet': [
                '{{url}}', '{{domain}}', '{{ip}}', '{{mac}}'
            ],
            'Text': [
                '{{word}}', '{{words}}', '{{words:5}}', '{{sentence}}', 
                '{{paragraph}}', '{{title}}'
            ],
            'Other': [
                '{{color}}', '{{image}}', '{{image:300:200}}', '{{avatar}}',
                '{{oneOf:success,error,pending}}', '{{boolean}}', 
                '{{arrayOf:3:name}}'
            ],
            'Request Context': [
                '{{requestId}}', '{{userAgent}}', '{{requestPath}}', '{{requestMethod}}'
            ]
        };
    }
}

module.exports = new DynamicResponseGenerator();
