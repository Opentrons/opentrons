'use strict'

module.exports = {
  testPathIgnorePatterns: ['.*\\.d\\.ts'],
  moduleNameMapper: {
    '^@opentrons/api-client$': `@opentrons/api-client/src/index.ts`,
    '^@opentrons/react-api-client$': `@opentrons/api-client/src/index.ts`,
  },
}
