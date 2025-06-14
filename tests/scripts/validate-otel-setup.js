#!/usr/bin/env node

/**
 * Quick OpenTelemetry and Prometheus Setup Validation
 * 
 * This script validates the setup without starting the full server:
 * - Checks if all required dependencies are installed
 * - Validates OpenTelemetry configuration
 * - Tests metrics module initialization
 * - Verifies tracer setup
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.cyan);
}

function logWarn(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

// Test functions
function checkDependencies() {
    logInfo('Checking OpenTelemetry and Prometheus dependencies...');
    
    try {
        const packageJsonPath = path.join(__dirname, '../../package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        const requiredDeps = [
            '@opentelemetry/api',
            '@opentelemetry/auto-instrumentations-node',
            '@opentelemetry/exporter-prometheus',
            '@opentelemetry/instrumentation',
            '@opentelemetry/instrumentation-express',
            '@opentelemetry/instrumentation-http',
            '@opentelemetry/resources',
            '@opentelemetry/sdk-metrics',
            '@opentelemetry/sdk-node',
            '@opentelemetry/semantic-conventions',
            'prom-client'
        ];

        const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
        
        if (missingDeps.length === 0) {
            logSuccess('All required dependencies are present in package.json');
            
            // Check if deprecated dependencies are removed
            const deprecatedDeps = ['@opentelemetry/api-metrics', '@opentelemetry/exporter-jaeger'];
            const foundDeprecated = deprecatedDeps.filter(dep => packageJson.dependencies[dep]);
            
            if (foundDeprecated.length > 0) {
                logWarn(`Deprecated packages found (should be removed): ${foundDeprecated.join(', ')}`);
                return false;
            }
            
            return true;
        } else {
            logError(`Missing dependencies: ${missingDeps.join(', ')}`);
            return false;
        }
    } catch (error) {
        logError(`Failed to check dependencies: ${error.message}`);
        return false;
    }
}

function checkNodeModules() {
    logInfo('Checking if dependencies are installed...');
    
    try {
        // Try to require key modules
        require('@opentelemetry/api');
        require('@opentelemetry/sdk-node');
        require('prom-client');
        
        logSuccess('Key dependencies are installed and accessible');
        return true;
    } catch (error) {
        logError(`Dependencies not installed: ${error.message}`);
        logInfo('Run "npm install" to install dependencies');
        return false;
    }
}

function validateTracerModule() {
    logInfo('Validating tracer module...');
    
    try {
        const tracerPath = path.join(__dirname, '../../server/tracer.js');
        
        if (!fs.existsSync(tracerPath)) {
            logError('Tracer module not found at server/tracer.js');
            return false;
        }
        
        // Try to require the tracer module (without initializing)
        delete require.cache[require.resolve(tracerPath)];
        const tracer = require(tracerPath);
        
        if (typeof tracer.initializeTracing === 'function' &&
            typeof tracer.shutdownTracing === 'function') {
            logSuccess('Tracer module structure is valid');
            return true;
        } else {
            logError('Tracer module missing required functions');
            return false;
        }
    } catch (error) {
        logError(`Tracer module validation failed: ${error.message}`);
        return false;
    }
}

function validateMetricsModule() {
    logInfo('Validating metrics module...');
    
    try {
        const metricsPath = path.join(__dirname, '../../server/metrics.js');
        
        if (!fs.existsSync(metricsPath)) {
            logError('Metrics module not found at server/metrics.js');
            return false;
        }
        
        // Try to require the metrics module
        delete require.cache[require.resolve(metricsPath)];
        const metrics = require(metricsPath);
        
        if (metrics.MetricsCollector && metrics.promClient) {
            logSuccess('Metrics module structure is valid');
            
            // Test basic functionality
            if (typeof metrics.MetricsCollector.recordHttpRequest === 'function' &&
                typeof metrics.MetricsCollector.getPrometheusMetrics === 'function') {
                logSuccess('Metrics collector methods are available');
                return true;
            } else {
                logError('Metrics collector missing required methods');
                return false;
            }
        } else {
            logError('Metrics module missing required exports');
            return false;
        }
    } catch (error) {
        logError(`Metrics module validation failed: ${error.message}`);
        return false;
    }
}

function validateMetricsMiddleware() {
    logInfo('Validating metrics middleware...');
    
    try {
        const middlewarePath = path.join(__dirname, '../../server/middleware/metrics.js');
        
        if (!fs.existsSync(middlewarePath)) {
            logError('Metrics middleware not found at server/middleware/metrics.js');
            return false;
        }
        
        // Try to require the middleware
        delete require.cache[require.resolve(middlewarePath)];
        const middleware = require(middlewarePath);
        
        if (typeof middleware.metricsMiddleware === 'function' &&
            typeof middleware.trackMockConfigChange === 'function') {
            logSuccess('Metrics middleware structure is valid');
            return true;
        } else {
            logError('Metrics middleware missing required functions');
            return false;
        }
    } catch (error) {
        logError(`Metrics middleware validation failed: ${error.message}`);
        return false;
    }
}

function validateMetricsRoutes() {
    logInfo('Validating metrics routes...');
    
    try {
        const routesPath = path.join(__dirname, '../../server/routes/metricsRoutes.js');
        
        if (!fs.existsSync(routesPath)) {
            logError('Metrics routes not found at server/routes/metricsRoutes.js');
            return false;
        }
        
        // Try to require the routes
        delete require.cache[require.resolve(routesPath)];
        const routes = require(routesPath);
        
        if (routes && typeof routes === 'function') {
            logSuccess('Metrics routes module is valid');
            return true;
        } else {
            logError('Metrics routes module structure invalid');
            return false;
        }
    } catch (error) {
        logError(`Metrics routes validation failed: ${error.message}`);
        return false;
    }
}

function checkEnvironmentConfig() {
    logInfo('Checking environment configuration...');
    
    try {
        const envExamplePath = path.join(__dirname, '../../.env.example');
        
        if (!fs.existsSync(envExamplePath)) {
            logWarn('.env.example file not found');
            return false;
        }
        
        const envContent = fs.readFileSync(envExamplePath, 'utf8');
        
        const requiredEnvVars = [
            'ENABLE_OTEL',
            'OTEL_SERVICE_NAME',
            'OTEL_SERVICE_VERSION',
            'PROMETHEUS_PORT',
            'PROMETHEUS_ENDPOINT'
        ];
        
        const missingVars = requiredEnvVars.filter(varName => 
            !envContent.includes(varName)
        );
        
        if (missingVars.length === 0) {
            logSuccess('Environment configuration template is complete');
            return true;
        } else {
            logWarn(`Missing environment variables in .env.example: ${missingVars.join(', ')}`);
            return false;
        }
    } catch (error) {
        logError(`Environment config check failed: ${error.message}`);
        return false;
    }
}

function validateDocumentation() {
    logInfo('Checking documentation...');
    
    try {
        const docsPath = path.join(__dirname, '../../docs/OPENTELEMETRY_METRICS.md');
        
        if (fs.existsSync(docsPath)) {
            logSuccess('OpenTelemetry metrics documentation is available');
            return true;
        } else {
            logWarn('OpenTelemetry metrics documentation not found');
            return false;
        }
    } catch (error) {
        logError(`Documentation check failed: ${error.message}`);
        return false;
    }
}

// Main validation function
async function runValidation() {
    log(`${colors.bold}🔍 OpenTelemetry and Prometheus Setup Validation${colors.reset}`);
    log(`${colors.cyan}===================================================${colors.reset}`);
    
    console.log();
    
    const tests = [
        { name: 'Dependencies Check', fn: checkDependencies },
        { name: 'Node Modules Check', fn: checkNodeModules },
        { name: 'Tracer Module', fn: validateTracerModule },
        { name: 'Metrics Module', fn: validateMetricsModule },
        { name: 'Metrics Middleware', fn: validateMetricsMiddleware },
        { name: 'Metrics Routes', fn: validateMetricsRoutes },
        { name: 'Environment Config', fn: checkEnvironmentConfig },
        { name: 'Documentation', fn: validateDocumentation }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        log(`\n${colors.yellow}Validating: ${test.name}${colors.reset}`);
        try {
            if (test.fn()) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            logError(`Validation "${test.name}" crashed: ${error.message}`);
            failed++;
        }
    }
    
    // Print results
    console.log();
    log(`${colors.bold}📊 Validation Results${colors.reset}`);
    log(`${colors.cyan}=====================${colors.reset}`);
    log(`✅ Passed: ${passed}`, colors.green);
    log(`❌ Failed: ${failed}`, colors.red);
    log(`📝 Total:  ${passed + failed}`);
    
    console.log();
    if (failed === 0) {
        log(`${colors.bold}🎉 All validations passed!${colors.reset}`, colors.green);
        log(`${colors.green}Your OpenTelemetry and Prometheus setup is ready.${colors.reset}`);
        console.log();
        log(`${colors.cyan}Next steps:${colors.reset}`);
        log(`${colors.cyan}1. Run "npm start" to start the server${colors.reset}`);
        log(`${colors.cyan}2. Run "npm run test-otel" to test the implementation${colors.reset}`);
        log(`${colors.cyan}3. Or run "./tests/scripts/test-otel-prometheus.sh" for full testing${colors.reset}`);
        
        process.exit(0);
    } else {
        log(`${colors.bold}💥 Some validations failed!${colors.reset}`, colors.red);
        log(`${colors.red}Please fix the issues above before proceeding.${colors.reset}`);
        
        process.exit(1);
    }
}

// Start validation
if (require.main === module) {
    runValidation().catch(error => {
        logError(`Validation runner crashed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { runValidation };
