#!/usr/bin/env node

const { getStorageInfo } = require('./utils/storageStrategy');

async function testStorage() {
    console.log('🔍 Testing Storage Configuration...\n');
    
    const storageInfo = getStorageInfo();
    console.log('📋 Storage Information:');
    console.log(JSON.stringify(storageInfo, null, 2));
    
    console.log('\n📝 Environment Variables:');
    console.log(`STORAGE_TYPE: ${process.env.STORAGE_TYPE || 'not set (default: file)'}`);
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL || 'not set'}`);
    console.log(`MONGODB_URL: ${process.env.MONGODB_URL || 'not set'}`);
    console.log(`USE_DB: ${process.env.USE_DB || 'not set'}`);
    
    console.log('\n🎯 Current Storage Backend:', storageInfo.current);
    console.log('📚 Supported Types:', storageInfo.supported.join(', '));
}

testStorage().catch(console.error);
