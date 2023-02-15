module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    globalSetup: '<rootDir>/src/testFetchAVDefinitions.ts',
    coverageReporters: [
        [
            'json',
            {
                projectRoot: '../../',
            },
        ],
        [
            'lcov',
            {
                projectRoot: '../../',
            },
        ],
        'text',
    ],
    moduleFileExtensions: ['js', 'json', 'jsx', 'd.ts', 'ts', 'node'],
    coveragePathIgnorePatterns: [],
    modulePathIgnorePatterns: ['local_buckets'],
}
