// config migration tests
import { MOCK_CONFIG_V12, MOCK_CONFIG_V13 } from '../__fixtures__'
import { migrate } from '../migrate'

describe('config migration', () => {
  it('should migrate version 12 to latest', () => {
    const v12Config = MOCK_CONFIG_V12
    const result = migrate(v12Config)

    expect(result.version).toBe(13)
    expect(result).toEqual(MOCK_CONFIG_V13)
  })

  it('should keep version 13', () => {
    const v13Config = MOCK_CONFIG_V13
    const result = migrate(v13Config)

    expect(result.version).toBe(13)
    expect(result).toEqual(v13Config)
  })
})
