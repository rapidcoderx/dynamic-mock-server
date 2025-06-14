const { findMock } = require('../../utils/matcher');

// Test data mimicking your mocks
const testMocks = [
  {
    id: "1",
    name: "test-hello",
    method: "GET",
    path: "/api/test-hello",
    headers: {
      "x-env": "dev"
    },
    response: {
      "message": "Hello from mock"
    }
  },
  {
    id: "2", 
    name: "test-hello-1",
    method: "GET",
    path: "/api/test-hello",
    headers: {
      "x-env": "dev",
      "x-repeat": "yes"
    },
    response: {
      "message": "Hello from mock 1"
    }
  },
  {
    id: "3",
    name: "test-hello-2", 
    method: "GET",
    path: "/api/test-hello",
    headers: {
      "x-env": "dev",
      "x-repeat": "post"
    },
    response: {
      "message": "Hello from mock 2"
    }
  }
];

// Test cases
console.log('Testing mock matching...\n');

// Test 1: Only x-env header
const test1 = findMock({
  method: "GET",
  path: "/api/test-hello", 
  headers: { "x-env": "dev" }
}, testMocks);
console.log('Test 1 (x-env: dev only):', test1.found ? `${test1.mock.name} - ${test1.mock.response.message}` : 'Not found');

// Test 2: x-env and x-repeat=yes
const test2 = findMock({
  method: "GET",
  path: "/api/test-hello",
  headers: { "x-env": "dev", "x-repeat": "yes" }
}, testMocks);
console.log('Test 2 (x-env: dev, x-repeat: yes):', test2.found ? `${test2.mock.name} - ${test2.mock.response.message}` : 'Not found');

// Test 3: x-env and x-repeat=post  
const test3 = findMock({
  method: "GET", 
  path: "/api/test-hello",
  headers: { "x-env": "dev", "x-repeat": "post" }
}, testMocks);
console.log('Test 3 (x-env: dev, x-repeat: post):', test3.found ? `${test3.mock.name} - ${test3.mock.response.message}` : 'Not found');

// Test 4: No matching headers
const test4 = findMock({
  method: "GET",
  path: "/api/test-hello", 
  headers: { "x-env": "prod" }
}, testMocks);
console.log('Test 4 (x-env: prod - no match):', test4.found ? test4.mock.name : `404 - ${test4.response.error}`);

// Test 5: Different path entirely
const test5 = findMock({
  method: "GET",
  path: "/api/different-path", 
  headers: { "x-env": "dev" }
}, testMocks);
console.log('Test 5 (different path):', test5.found ? test5.mock.name : `404 - ${test5.response.error}`);
