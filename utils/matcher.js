function findMock({ method, path, headers }, mockStore) {
    // Filter candidates by method and path
    const candidates = mockStore.filter(mock =>
        mock.method === method &&
        mock.path === path
    );

    if (candidates.length === 0) {
        return createNotFoundResponse(method, path, headers, mockStore);
    }

    // If only one candidate, return it if headers match
    if (candidates.length === 1) {
        const mock = candidates[0];
        const mockHeaders = mock.headers || {};
        
        // Check if all required headers match
        const allMatch = Object.entries(mockHeaders).every(
            ([key, value]) => headers[key.toLowerCase()] === value
        );
        
        return allMatch ? { found: true, mock } : createNotFoundResponse(method, path, headers, mockStore, candidates);
    }

    // Multiple candidates - find the best match
    const validMatches = [];
    
    for (const mock of candidates) {
        const mockHeaders = mock.headers || {};
        
        // Check if all required headers match exactly
        const allMatch = Object.entries(mockHeaders).every(
            ([key, value]) => headers[key.toLowerCase()] === value
        );
        
        if (allMatch) {
            validMatches.push({
                mock,
                headerCount: Object.keys(mockHeaders).length,
                headers: mockHeaders
            });
        }
    }

    if (validMatches.length === 0) {
        return createNotFoundResponse(method, path, headers, mockStore, candidates);
    }

    // Sort by header count (descending) - most specific match first
    validMatches.sort((a, b) => b.headerCount - a.headerCount);
    
    // Return the most specific match (the one with the most headers)
    return { found: true, mock: validMatches[0].mock };
}

function createNotFoundResponse(method, path, headers, mockStore, candidates = []) {
    // Find similar mocks for suggestions
    const availableMocks = mockStore
        .filter(m => m.method === method || m.path === path)
        .map(m => ({
            method: m.method,
            path: m.path,
            headers: Object.keys(m.headers || {}).length > 0 ? m.headers : undefined
        }));

    // Extract custom headers (starting with x-)
    const customHeaders = Object.keys(headers)
        .filter(h => h.toLowerCase().startsWith('x-'))
        .reduce((acc, h) => {
            acc[h] = headers[h];
            return acc;
        }, {});

    return {
        found: false,
        statusCode: 404,
        response: {
            error: 'No mock found for this request',
            request: {
                method,
                path,
                headers: customHeaders
            },
            suggestion: candidates.length > 0 
                ? 'Check if your request headers match the required headers for existing mocks'
                : availableMocks.length > 0
                    ? 'Check method, path, or headers - similar endpoints exist'
                    : 'No similar mocks found. Register a new mock for this endpoint.',
            availableSimilarMocks: availableMocks.length > 0 ? availableMocks : undefined,
            exactPathMatches: candidates.length > 0 ? candidates.map(c => ({
                name: c.name,
                method: c.method,
                path: c.path,
                requiredHeaders: c.headers
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

    // Check for exact header signature conflicts
    for (const existing of conflicts) {
        const existingHeaders = existing.headers || {};
        const newHeaders = newMock.headers || {};
        
        // Convert headers to normalized comparison format
        const existingHeaderKeys = Object.keys(existingHeaders).sort();
        const newHeaderKeys = Object.keys(newHeaders).sort();
        
        // If both have no headers, it's a conflict
        if (existingHeaderKeys.length === 0 && newHeaderKeys.length === 0) {
            return false;
        }
        
        // If one has headers and other doesn't, it's allowed (for fallback)
        if (existingHeaderKeys.length === 0 || newHeaderKeys.length === 0) {
            continue;
        }
        
        // Check if header signatures are identical
        if (existingHeaderKeys.length === newHeaderKeys.length &&
            existingHeaderKeys.every(key => newHeaderKeys.includes(key))) {
            
            // Check if values are also identical
            const sameValues = existingHeaderKeys.every(key =>
                existingHeaders[key] === newHeaders[key]
            );
            
            if (sameValues) {
                return false; // Exact duplicate found
            }
        }
    }

    return true; // No exact duplicates found
}

module.exports = { findMock, isUniqueMock };
