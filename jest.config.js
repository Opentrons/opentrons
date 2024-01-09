'use strict'

module.exports = {
  setupFilesAfterEnv: [
    '<rootDir>/scripts/setup-global-mocks.js',
    '<rootDir>/scripts/setup-global-imports.js',
  ],
  globals: {
    __webpack_public_path__: '/',
  },
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
    '\\.(jpg|png|gif|svg|woff|woff2|webm)$':
      '@opentrons/components/src/__mocks__/file.js',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/shared-data/python/.*',
    '<rootDir>/api/.*',
    '<rootDir>/robot-server/.*',
    '<rootDir>/update-server/.*',
  ],
  transformIgnorePatterns: ['/node_modules/(?!@opentrons/)'],
  collectCoverageFrom: [
    'app/src/**/*.(js|ts|tsx)',
    'app-shell/src/**/*.(js|ts|tsx)',
    'app-shell-odd/src/**/*.(js|ts|tsx)',
    'components/src/**/*.(js|ts|tsx)',
    'discovery-client/src/**/*.(js|ts|tsx)',
    'labware-library/src/**/*.(js|ts|tsx)',
    'protocol-designer/src/**/*.(js|ts|tsx)',
    'shared-data/js/**/*.(js|ts|tsx)',
    'step-generation/src/**/*.(js|ts|tsx)',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__mocks__/',
    '/__tests__/',
    '/__fixtures__/',
    '/__utils__/',
    '/test/',
    '/scripts/',
  ],
  testPathIgnorePatterns: ['cypress/', '/node_modules/', '.*.d.ts'],
  coverageReporters: ['lcov', 'text-summary'],
  watchPathIgnorePatterns: ['/node_modules/'],
}
