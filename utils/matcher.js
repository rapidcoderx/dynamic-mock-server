function findMock({ method, path, headers, query = {} }, mockStore) {
    // Filter candidates by method and path
    const candidates = mockStore.filter(mock =>
        mock.method === method &&
        mock.path === path
    );

    if (candidates.length === 0) {
        return createNotFoundResponse(method, path, headers, query, mockStore);
    }

    // If only one candidate, return it if headers and query params match
    if (candidates.length === 1) {
        const mock = candidates[0];
        const mockHeaders = mock.headers || {};
        const mockQuery = mock.queryParams || {};
        
        // Check if all required headers match
        const headersMatch = Object.entries(mockHeaders).every(
            ([key, value]) => headers[key.toLowerCase()] === value
        );
        
        // Check if all required query parameters match
        const queryMatch = matchQueryParameters(query, mockQuery);
        
        return (headersMatch && queryMatch) ? { found: true, mock } : createNotFoundResponse(method, path, headers, query, mockStore, candidates);
    }

    // Multiple candidates - find the best match
    const validMatches = [];
    
    for (const mock of candidates) {
        const mockHeaders = mock.headers || {};
        const mockQuery = mock.queryParams || {};
        
        // Check if all required headers match exactly
        const headersMatch = Object.entries(mockHeaders).every(
            ([key, value]) => headers[key.toLowerCase()] === value
        );
        
        // Check if all required query parameters match
        const queryMatch = matchQueryParameters(query, mockQuery);
        
        if (headersMatch && queryMatch) {
            validMatches.push({
                mock,
                headerCount: Object.keys(mockHeaders).length,
                queryCount: Object.keys(mockQuery).length,
                headers: mockHeaders,
                queryParams: mockQuery
            });
        }
    }

    if (validMatches.length === 0) {
        return createNotFoundResponse(method, path, headers, query, mockStore, candidates);
    }

    // Sort by specificity: query params count first, then header count (descending)
    validMatches.sort((a, b) => {
        if (b.queryCount !== a.queryCount) {
            return b.queryCount - a.queryCount;
        }
        return b.headerCount - a.headerCount;
    });
    
    // Return the most specific match (the one with the most query params and headers)
    return { found: true, mock: validMatches[0].mock };
}

// Function to match query parameters with different matching strategies
function matchQueryParameters(requestQuery, mockQueryConfig) {
    if (!mockQueryConfig || Object.keys(mockQueryConfig).length === 0) {
        return true; // No query requirements, so it matches
    }

    for (const [paramName, paramConfig] of Object.entries(mockQueryConfig)) {
        const requestValue = requestQuery[paramName];
        
        // If parameter is required but missing from request
        if (paramConfig.required !== false && (requestValue === undefined || requestValue === null)) {
            return false;
        }
        
        // If parameter is not required and missing, skip validation
        if (paramConfig.required === false && (requestValue === undefined || requestValue === null)) {
            continue;
        }
        
        // Validate the parameter value based on matching type
        if (!validateQueryParameter(requestValue, paramConfig)) {
            return false;
        }
    }
    
    return true;
}

// Function to validate individual query parameter based on its configuration
function validateQueryParameter(value, config) {
    if (typeof config === 'string') {
        // Simple string value - exact match
        return value === config;
    }
    
    if (typeof config !== 'object') {
        return false;
    }
    
    const { matchType = 'equals', value: expectedValue, caseSensitive = true } = config;
    
    if (expectedValue === undefined || expectedValue === null) {
        return true; // No value requirement
    }
    
    // Convert to strings for comparison
    const requestStr = String(value);
    const expectedStr = String(expectedValue);
    
    // Apply case sensitivity
    const compareValue = caseSensitive ? requestStr : requestStr.toLowerCase();
    const compareExpected = caseSensitive ? expectedStr : expectedStr.toLowerCase();
    
    switch (matchType) {
        case 'equals':
            return compareValue === compareExpected;
            
        case 'contains':
            return compareValue.includes(compareExpected);
            
        case 'starts_with':
            return compareValue.startsWith(compareExpected);
            
        case 'ends_with':
            return compareValue.endsWith(compareExpected);
            
        case 'regex':
            try {
                const flags = caseSensitive ? '' : 'i';
                const regex = new RegExp(expectedStr, flags);
                return regex.test(requestStr);
            } catch (error) {
                console.warn(`Invalid regex pattern: ${expectedStr}`, error);
                return false;
            }
            
        case 'not_equals':
            return compareValue !== compareExpected;
            
        case 'exists':
            return value !== undefined && value !== null && value !== '';
            
        case 'not_exists':
            return value === undefined || value === null || value === '';
            
        default:
            console.warn(`Unknown match type: ${matchType}`);
            return compareValue === compareExpected;
    }
}

function createNotFoundResponse(method, path, headers, query = {}, mockStore, candidates = []) {
    // Find similar mocks for suggestions
    const availableMocks = mockStore
        .filter(m => m.method === method || m.path === path)
        .map(m => ({
            method: m.method,
            path: m.path,
            headers: Object.keys(m.headers || {}).length > 0 ? m.headers : undefined,
            queryParams: Object.keys(m.queryParams || {}).length > 0 ? m.queryParams : undefined
        }));

    // Extract custom headers (starting with x-)
    const customHeaders = Object.keys(headers)
        .filter(h => h.toLowerCase().startsWith('x-'))
        .reduce((acc, h) => {
            acc[h] = headers[h];
            return acc;
        }, {});

    // Format query params for display
    const queryDisplay = Object.keys(query).length > 0 ? query : undefined;

    return {
        found: false,
        statusCode: 404,
        response: {
            error: 'No mock found for this request',
            request: {
                method,
                path,
                headers: customHeaders,
                query: queryDisplay
            },
            suggestion: candidates.length > 0 
                ? 'Check if your request headers and query parameters match the required conditions for existing mocks'
                : availableMocks.length > 0
                    ? 'Check method, path, headers, or query parameters - similar endpoints exist'
                    : 'No similar mocks found. Register a new mock for this endpoint.',
            availableSimilarMocks: availableMocks.length > 0 ? availableMocks : undefined,
            exactPathMatches: candidates.length > 0 ? candidates.map(c => ({
                name: c.name,
                method: c.method,
                path: c.path,
                requiredHeaders: c.headers,
                requiredQueryParams: c.queryParams
            })) : undefined
        }
    };
}

// Helper function to check if a mock configuration would create a duplicate
function isUniqueMock(newMock, mockStore) {
    const conflicts = mockStore.filter(existing => 
        existing.method === newMock.method &&
        existing.path === newMock.path
    );

    if (conflicts.length === 0) {
        return true; // No conflicts
    }

    // Check for exact header and query parameter signature conflicts
    for (const existing of conflicts) {
        const existingHeaders = existing.headers || {};
        const newHeaders = newMock.headers || {};
        const existingQuery = existing.queryParams || {};
        const newQuery = newMock.queryParams || {};
        
        // Convert headers to normalized comparison format
        const existingHeaderKeys = Object.keys(existingHeaders).sort();
        const newHeaderKeys = Object.keys(newHeaders).sort();
        const existingQueryKeys = Object.keys(existingQuery).sort();
        const newQueryKeys = Object.keys(newQuery).sort();
        
        // If both have no headers and no query params, it's a conflict
        if (existingHeaderKeys.length === 0 && newHeaderKeys.length === 0 && 
            existingQueryKeys.length === 0 && newQueryKeys.length === 0) {
            return false;
        }
        
        // Check if signatures are identical
        const headersIdentical = arraysEqual(existingHeaderKeys, newHeaderKeys) &&
            existingHeaderKeys.every(key => existingHeaders[key] === newHeaders[key]);
            
        const queryIdentical = arraysEqual(existingQueryKeys, newQueryKeys) &&
            existingQueryKeys.every(key => 
                JSON.stringify(existingQuery[key]) === JSON.stringify(newQuery[key])
            );
        
        if (headersIdentical && queryIdentical) {
            return false; // Exact duplicate found
        }
    }

    return true; // No exact duplicates found
}

// Helper function to compare arrays for equality
function arraysEqual(a, b) {
    return a.length === b.length && a.every((val, index) => val === b[index]);
}

module.exports = { findMock, isUniqueMock, matchQueryParameters, validateQueryParameter };
