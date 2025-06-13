#!/usr/bin/env node

// Test script to validate query parameter functionality
const { findMock } = require('./utils/matcher');

// Sample mocks for testing
const testMocks = [
  {
    id: '1',
    name: 'Electronics Products',
    method: 'GET',
    path: '/api/products',
    queryParams: [
      {
        key: 'category',
        type: 'equals',
        value: 'electronics',
        required: true
      }
    ],
    response: { message: 'Electronics products' }
  },
  {
    id: '2', 
    name: 'User Search',
    method: 'GET',
    path: '/api/users',
    queryParams: [
      {
        key: 'name',
        type: 'contains',
        value: 'john',
        required: true
      }
    ],
    response: { message: 'Users containing john' }
  },
  {
    id: '3',
    name: 'Debug Mode',
    method: 'GET', 
    path: '/api/status',
    queryParams: [
      {
        key: 'debug',
        type: 'exists',
        required: true
      }
    ],
    response: { message: 'Debug information' }
  },
  {
    id: '4',
    name: 'Default Products',
    method: 'GET',
    path: '/api/products',
    queryParams: [],
    response: { message: 'All products' }
  }
];

// Test cases
const testCases = [
  {
    description: 'Electronics category match',
    method: 'GET',
    path: '/api/products',
    query: { category: 'electronics' },
    expectedMock: '1'
  },
  {
    description: 'User name contains match',
    method: 'GET', 
    path: '/api/users',
    query: { name: 'johnny' },
    expectedMock: '2'
  },
  {
    description: 'Debug parameter exists',
    method: 'GET',
    path: '/api/status', 
    query: { debug: 'true' },
    expectedMock: '3'
  },
  {
    description: 'Fallback to default products',
    method: 'GET',
    path: '/api/products',
    query: {},
    expectedMock: '4'
  },
  {
    description: 'No match should fallback',
    method: 'GET',
    path: '/api/products',
    query: { category: 'clothing' },
    expectedMock: '4'
  }
];

console.log('🧪 Testing Query Parameter Functionality\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  try {
    const result = findMock(testMocks, testCase.method, testCase.path, {}, testCase.query);
    
    if (result && result.id === testCase.expectedMock) {
      console.log(`✅ Test ${index + 1}: ${testCase.description} - PASSED`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${testCase.description} - FAILED`);
      console.log(`   Expected mock: ${testCase.expectedMock}, Got: ${result ? result.id : 'null'}`);
      failed++;
    }
  } catch (error) {
    console.log(`💥 Test ${index + 1}: ${testCase.description} - ERROR`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All tests passed! Query parameter functionality is working correctly.');
} else {
  console.log('⚠️  Some tests failed. Please check the implementation.');
  process.exit(1);
}
