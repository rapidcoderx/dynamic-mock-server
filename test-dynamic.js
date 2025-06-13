#!/usr/bin/env node

const dynamicResponse = require('./utils/dynamicResponse.js');

// Test the problematic cases
async function testDynamicValues() {
    console.log('Testing Dynamic Value Generation...\n');
    
    // Test oneOf with dynamic ENABLED
    const test1 = {
        timestamp: "{{timestamp}}",
        status: "{{oneOf:success,error}}"
    };
    
    console.log('=== DYNAMIC ENABLED (default) ===');
    console.log('Input 1:', JSON.stringify(test1, null, 2));
    const result1 = await dynamicResponse.processResponse({ response: test1, dynamic: true });
    console.log('Output 1:', JSON.stringify(result1.response, null, 2));
    console.log('Metadata:', JSON.stringify(result1.metadata, null, 2));
    console.log('---');
    
    // Test arrayOf with dynamic ENABLED
    const test2 = {
        products: "{{arrayOf:3:word}}",
        total: "{{number:10:100}}"
    };
    
    console.log('Input 2:', JSON.stringify(test2, null, 2));
    const result2 = await dynamicResponse.processResponse({ response: test2, dynamic: true });
    console.log('Output 2:', JSON.stringify(result2.response, null, 2));
    console.log('---');
    
    // Test with dynamic DISABLED
    console.log('\n=== DYNAMIC DISABLED ===');
    console.log('Input 3:', JSON.stringify(test1, null, 2));
    const result3 = await dynamicResponse.processResponse({ response: test1, dynamic: false });
    console.log('Output 3:', JSON.stringify(result3.response, null, 2));
    console.log('Metadata:', JSON.stringify(result3.metadata, null, 2));
    console.log('---');
    
    console.log('Input 4:', JSON.stringify(test2, null, 2));
    const result4 = await dynamicResponse.processResponse({ response: test2, dynamic: false });
    console.log('Output 4:', JSON.stringify(result4.response, null, 2));
    console.log('Metadata:', JSON.stringify(result4.metadata, null, 2));
}

testDynamicValues().catch(console.error);
