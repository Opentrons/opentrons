// @flow
// config migration tests
import {
  MOCK_CONFIG_V0,
  MOCK_CONFIG_V1,
  MOCK_CONFIG_V2,
  MOCK_CONFIG_V3,
} from '../__fixtures__'
import { migrate } from '../migrate'

describe('config migration', () => {
  it('should migrate version 0 to latest', () => {
    const v0Config = MOCK_CONFIG_V0
    const result = migrate(v0Config)

    expect(result.version).toBe(3)
    expect(result).toEqual(MOCK_CONFIG_V3)
  })

  it('should migrate version 1 to latest', () => {
    const v1Config = MOCK_CONFIG_V1
    const result = migrate(v1Config)

    expect(result.version).toBe(3)
    expect(result).toEqual(MOCK_CONFIG_V3)
  })

  it('should migrate version 2 to latest', () => {
    const v2Config = MOCK_CONFIG_V2
    const result = migrate(v2Config)

    expect(result.version).toBe(3)
    expect(result).toEqual(MOCK_CONFIG_V3)
  })

  it('should keep version 3 unchanged', () => {
    const v3Config = {
      ...MOCK_CONFIG_V3,
      support: {
        ...MOCK_CONFIG_V3.support,
        name: 'Known Kname',
        email: 'hello@example.com',
      },
    }
    const result = migrate(v3Config)

    expect(result.version).toBe(3)
    expect(result).toEqual(v3Config)
  })
})
