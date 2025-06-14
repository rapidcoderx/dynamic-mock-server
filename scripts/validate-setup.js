#!/usr/bin/env node

/**
 * Validate Dynamic Mock Server Setup
 * 
 * This script validates that the server configuration is correct,
 * especially the conditional OpenTelemetry setup.
 */

require('dotenv').config();

console.log('🧪 Dynamic Mock Server - Setup Validation');
console.log('==========================================');
console.log('');

// Test OpenTelemetry configuration
console.log('📊 OpenTelemetry Configuration:');
const otelEnabled = process.env.ENABLE_OTEL === 'true';
console.log(`   ENABLE_OTEL: ${process.env.ENABLE_OTEL || 'undefined'} (${otelEnabled ? 'ENABLED' : 'DISABLED'})`);

if (otelEnabled) {
    console.log(`   OTEL_SERVICE_NAME: ${process.env.OTEL_SERVICE_NAME || 'dynamic-mock-server'}`);
    console.log(`   PROMETHEUS_PORT: ${process.env.PROMETHEUS_PORT || '9464'}`);
    console.log(`   ENABLE_TRACING: ${process.env.ENABLE_TRACING || 'false'}`);
    
    if (process.env.ENABLE_TRACING === 'true') {
        console.log(`   OTLP_ENDPOINT: ${process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces'}`);
    }
} else {
    console.log('   ℹ️  OpenTelemetry is disabled - server will run in lightweight mode');
}

console.log('');

// Test basic module loading
console.log('📦 Module Loading Tests:');

try {
    console.log('   ✅ Loading core server modules...');
    const express = require('express');
    const logger = require('../server/logger');
    console.log('   ✅ Core modules loaded successfully');
    
    if (otelEnabled) {
        console.log('   🔍 Testing OpenTelemetry modules...');
        const tracer = require('../server/tracer');
        const metrics = require('../server/middleware/metrics');
        console.log('   ✅ OpenTelemetry modules loaded successfully');
    } else {
        console.log('   ⏭️  Skipping OpenTelemetry modules (disabled)');
    }
    
    console.log('   ✅ All required modules loaded successfully');
} catch (error) {
    console.log(`   ❌ Module loading failed: ${error.message}`);
    process.exit(1);
}

console.log('');

// Test file structure
console.log('📁 File Structure Validation:');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
    'server/index.js',
    'server/tracer.js',
    'server/metrics.js',
    'server/middleware/metrics.js',
    'server/routes/metricsRoutes.js',
    'scripts/setup-database.sh',
    'sql/emergency-analytics-cleanup.sql',
    'docs/OPENTELEMETRY_METRICS.md',
    '.env.example',
    'LICENSE'
];

let allFilesExist = true;
for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ❌ ${file} - MISSING`);
        allFilesExist = false;
    }
}

if (!allFilesExist) {
    console.log('');
    console.log('❌ Some required files are missing!');
    process.exit(1);
}

console.log('');

// Test environment configuration
console.log('⚙️  Environment Configuration:');
console.log(`   PORT: ${process.env.PORT || '8080'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   STORAGE_TYPE: ${process.env.STORAGE_TYPE || 'file'}`);
console.log(`   API_PREFIX: ${process.env.API_PREFIX || '/api'}`);

console.log('');
console.log('✅ All validation tests passed!');
console.log('');

if (otelEnabled) {
    console.log('🚀 To start with OpenTelemetry enabled:');
    console.log('   npm start');
    console.log('');
    console.log('📊 Metrics will be available at:');
    console.log(`   http://localhost:${process.env.PROMETHEUS_PORT || '9464'}/metrics`);
} else {
    console.log('🚀 To start in lightweight mode:');
    console.log('   npm start');
    console.log('');
    console.log('💡 To enable monitoring, set ENABLE_OTEL=true in .env');
}

console.log('');
console.log('📚 For more information:');
console.log('   • docs/OPENTELEMETRY_METRICS.md - Metrics documentation');
console.log('   • docs/README.md - All documentation');
console.log('   • scripts/setup-database.sh - Database setup');
