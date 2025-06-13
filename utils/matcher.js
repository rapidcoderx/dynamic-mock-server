function findMock({ method, path, headers }, mockStore) {
    const candidates = mockStore.filter(mock =>
        mock.method === method &&
        mock.path === path
    );

    for (const mock of candidates) {
        const mockHeaders = mock.headers || {};
        const allMatch = Object.entries(mockHeaders).every(
            ([key, value]) => headers[key.toLowerCase()] === value
        );
        if (allMatch) return mock;
    }

    return null;
}

module.exports = { findMock };
