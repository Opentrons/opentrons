// @flow
// config migration tests
import { MOCK_CONFIG_V0, MOCK_CONFIG_V1 } from '../__fixtures__'
import { migrate } from '../migrate'

describe('config migration', () => {
  it('should migrate version 0 to latest', () => {
    const v0Config = MOCK_CONFIG_V0
    const result = migrate(v0Config)

    expect(result.version).toBe(1)
    expect(result).toEqual(MOCK_CONFIG_V1)
  })

  it('should keep version 1 unchanged', () => {
    const v1Config = {
      ...MOCK_CONFIG_V1,
      discovery: { ...MOCK_CONFIG_V1.discovery, disableCache: true },
    }
    const result = migrate(v1Config)

    expect(result.version).toBe(1)
    expect(result).toEqual(v1Config)
  })
})
