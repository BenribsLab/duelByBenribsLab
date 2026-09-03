module.exports = {
  testEnvironment: 'node',
  globalSetup: '<rootDir>/jest.globalSetup.js',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  testTimeout: 30000,
  // Les suites d'intégration partagent le même fichier SQLite : pas de parallélisme.
  maxWorkers: 1
};
