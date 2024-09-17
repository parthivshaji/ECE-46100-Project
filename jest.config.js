module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'], // Look for tests in tests/ directory
  moduleFileExtensions: ['ts', 'js'],
  moduleDirectories: ['node_modules', 'src'],  // Allow Jest to resolve src/ imports
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'           // Map src/ for easy imports in tests
  }
};