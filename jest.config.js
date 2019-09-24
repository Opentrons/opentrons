'use strict'

module.exports = {
  setupFiles: [
    '<rootDir>/scripts/setup-enzyme.js',
    '<rootDir>/scripts/setup-global-mocks.js',
  ],
  globals: {
    __webpack_public_path__: '/',
  },
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
    '\\.(jpg|png|gif|svg|woff|woff2)$':
      '@opentrons/components/src/__mocks__/file.js',
  },
  transformIgnorePatterns: ['/node_modules/(?!@opentrons/)'],
  collectCoverageFrom: [
    '**/*.js',
    '!.eslintrc.js',
    '!.stylelintrc.js',
    '!api/**',
    '!webpack-config/**',
    '!**/scripts/**',
    '!components/interfaces/**',
    '!components/styleguide.config.js',
    '!**/node_modules/**',
    '!**/__mocks__/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/webpack*',
    '!**/webpack/**',
    '!**/coverage/**',
    '!**/test/**',
    '!**/test-with-flow/**',
    '!**/flow-typed/**',
  ],
  coverageReporters: ['lcov', 'text-summary'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
}
