// @flow
// config tests
import { migrate } from '../config/migration'
import { MOCK_CONFIG_V0, MOCK_CONFIG_V1 } from '../__fixtures__/config'
import type { ConfigIntermediateV0ToV1 } from '@opentrons/app/src/config/ConfigTypes'

describe('Config migration', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should migrate to version 1', () => {
    const v0Config: ConfigIntermediateV0ToV1 = MOCK_CONFIG_V0
    const result = migrate(v0Config)
    expect(result).toStrictEqual(MOCK_CONFIG_V1)
    expect(result.version).toBe(1)
    expect(result).toHaveProperty('discovery.disableDiscoveryCache', false)
  })
})
