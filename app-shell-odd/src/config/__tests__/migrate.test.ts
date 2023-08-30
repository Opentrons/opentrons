// config migration tests
import {
  MOCK_CONFIG_V12,
  MOCK_CONFIG_V13,
  MOCK_CONFIG_V14,
  MOCK_CONFIG_V15,
  MOCK_CONFIG_V16,
  MOCK_CONFIG_V17,
  MOCK_CONFIG_V18,
} from '../__fixtures__'
import { migrate } from '../migrate'

describe('config migration', () => {
  it('should migrate version 12 to latest', () => {
    const v12Config = MOCK_CONFIG_V12
    const result = migrate(v12Config)

    expect(result.version).toBe(18)
    expect(result).toEqual(MOCK_CONFIG_V18)
  })

  it('should migrate version 13 to latest', () => {
    const v13Config = MOCK_CONFIG_V13
    const result = migrate(v13Config)

    expect(result.version).toBe(18)
    expect(result).toEqual(MOCK_CONFIG_V18)
  })

  it('should migrate version 14 to latest', () => {
    const v14Config = MOCK_CONFIG_V14
    const result = migrate(v14Config)

    expect(result.version).toBe(18)
    expect(result).toEqual(MOCK_CONFIG_V18)
  })

  it('should migrate version 15 to latest', () => {
    const v15Config = MOCK_CONFIG_V15
    const result = migrate(v15Config)

    expect(result.version).toBe(18)
    expect(result).toEqual(MOCK_CONFIG_V18)
  })

  it('should migrate version 16 to latest', () => {
    const v16Config = MOCK_CONFIG_V16
    const result = migrate(v16Config)

    expect(result.version).toBe(18)
    expect(result).toEqual(MOCK_CONFIG_V18)
  })

  it('should migrate version 17 to latest', () => {
    const v17Config = MOCK_CONFIG_V17
    const result = migrate(v17Config)

    expect(result.version).toBe(18)
    expect(result).toEqual(MOCK_CONFIG_V18)
  })

  it('should keep version 18', () => {
    const v18Config = MOCK_CONFIG_V18
    const result = migrate(v18Config)

    expect(result.version).toBe(18)
    expect(result).toEqual(v18Config)
  })
})
