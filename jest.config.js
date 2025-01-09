/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest', // Use ts-jest preset
    testEnvironment: 'node', // Use Node.js environment
    es2020: true,
    moduleFileExtensions: ['ts', 'js'], // Recognize TypeScript and JavaScript files
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'], // Test file patterns
    globalSetup: './tests/setup.ts',
};
