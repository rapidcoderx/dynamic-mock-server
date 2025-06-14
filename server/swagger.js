const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dynamic Mock Server API',
      version: '1.0.0',
      description: `
        A powerful and flexible mock server with analytics, dynamic responses, and intelligent routing.
      `,
      contact: {
        name: 'Dynamic Mock Server',
        url: 'https://github.com/your-repo/dynamic-mock-server'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_PREFIX || '/api',
        description: 'Dynamic Mock Server API'
      }
    ],
    components: {
      schemas: {
        Mock: {
          type: 'object',
          required: ['name', 'method', 'path', 'response'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the mock',
              example: 'mock_1234567890'
            },
            name: {
              type: 'string',
              description: 'Human-readable name for the mock',
              example: 'Get User Profile'
            },
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
              description: 'HTTP method',
              example: 'GET'
            },
            path: {
              type: 'string',
              description: 'URL path pattern',
              example: '/users/:id'
            },
            headers: {
              type: 'object',
              description: 'Required headers for matching',
              example: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer token'
              }
            },
            queryParams: {
              type: 'array',
              description: 'Query parameter matching rules',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string', example: 'status' },
                  type: { 
                    type: 'string', 
                    enum: ['equals', 'contains', 'starts_with', 'ends_with', 'regex', 'exists', 'not_exists'],
                    example: 'equals'
                  },
                  value: { type: 'string', example: 'active' },
                  required: { type: 'boolean', example: true }
                }
              }
            },
            response: {
              type: 'object',
              description: 'Response body (can include Faker.js placeholders)',
              example: {
                id: '{{faker.datatype.number}}',
                name: '{{faker.person.fullName}}',
                email: '{{faker.internet.email}}'
              }
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
              default: 200,
              example: 200
            },
            delay: {
              oneOf: [
                { type: 'integer', description: 'Fixed delay in milliseconds' },
                {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['random', 'network'] },
                    min: { type: 'integer' },
                    max: { type: 'integer' }
                  }
                }
              ],
              description: 'Response delay configuration'
            },
            dynamic: {
              type: 'boolean',
              description: 'Whether to process Faker.js placeholders',
              default: true
            }
          }
        },
        AnalyticsSummary: {
          type: 'object',
          properties: {
            overview: {
              type: 'object',
              properties: {
                totalRequests: { type: 'integer', example: 1250 },
                totalMockHits: { type: 'integer', example: 980 },
                uniqueMocksHit: { type: 'integer', example: 15 },
                recentRequests24h: { type: 'integer', example: 45 },
                weeklyRequests: { type: 'integer', example: 320 }
              }
            },
            performance: {
              type: 'object',
              properties: {
                averageResponseTime: { type: 'number', example: 125.5 },
                maxResponseTime: { type: 'integer', example: 500 },
                minResponseTime: { type: 'integer', example: 50 },
                responseTimeDistribution: {
                  type: 'object',
                  example: {
                    '0-10ms': 150,
                    '11-50ms': 300,
                    '51-100ms': 200,
                    '101-500ms': 50,
                    '501ms+': 5
                  }
                }
              }
            },
            topMocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  mockId: { type: 'string' },
                  mockName: { type: 'string' },
                  count: { type: 'integer' }
                }
              }
            },
            statusDistribution: {
              type: 'object',
              example: { '200': 800, '404': 200, '500': 50 }
            }
          }
        },
        RequestHistory: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'req_1234567890_abc123' },
            timestamp: { type: 'string', format: 'date-time' },
            method: { type: 'string', example: 'GET' },
            path: { type: 'string', example: '/api/users/123' },
            headers: { type: 'object' },
            query: { type: 'object' },
            bodySize: { type: 'integer', example: 0 },
            userAgent: { type: 'string' },
            ip: { type: 'string', example: '192.168.1.1' },
            mockMatched: {
              oneOf: [
                { type: 'null' },
                {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' }
                  }
                }
              ]
            },
            responseTime: { type: 'integer', example: 125 },
            statusCode: { type: 'integer', example: 200 },
            responseSize: { type: 'integer', example: 1024 }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'string',
              description: 'Additional error details'
            }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            storage: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'postgresql' },
                initialized: { type: 'boolean', example: true }
              }
            },
            mocks: { type: 'integer', example: 25 },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  apis: [
    './server/routes/*.js',
    './server/index.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
  swaggerServe: swaggerUi.serve,
  swaggerSetup: swaggerUi.setup(specs, {
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #2563eb; }
      .swagger-ui .scheme-container { 
        background: linear-gradient(145deg, #1f2937, #4b5563);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
    `,
    customSiteTitle: 'Dynamic Mock Server API Documentation',
    customfavIcon: '/favicon.svg'
  })
};
