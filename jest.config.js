'use strict'

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/scripts/setup-enzyme.js',
    '<rootDir>/scripts/setup-global-mocks.js',
    '<rootDir>/scripts/setup-global-imports.js',
  ],
  globals: {
    __webpack_public_path__: '/',
  },
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
    // '/^components/(.*)$/': '<rootDir>/components/src/$1',
    // '@opentrons/components(.*)$': '<rootDir>/components/src/$1',
    // '^@opentrons/components/(.*)$': '<rootDir>/$1',
    '@opentrons/components(.*)$': '<rootDir>/components/src/$1',
    // '@opentrons/api-client(.*)$': '<rootDir>/api-client/src/$1/',
    // '@opentrons/react-api-client(.*)$': '<rootDir>/react-api-client/src/$1/',
    // '@opentrons/shared-data(.*)$': '<rootDir>/shared-data/js/$1/',
    '@opentrons/shared-data(.*)$': '<rootDir>/shared-data/js/$1',
  },
  resolver: undefined,
  transform: {
    '^.+\\.(js|ts|tsx)$': 'esbuild-jest',
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
  snapshotSerializers: ['enzyme-to-json/serializer'],
  watchPathIgnorePatterns: ['/node_modules/'],
}
