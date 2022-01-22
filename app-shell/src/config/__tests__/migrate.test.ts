// config migration tests
import {
  MOCK_CONFIG_V0,
  MOCK_CONFIG_V1,
  MOCK_CONFIG_V2,
  MOCK_CONFIG_V3,
  MOCK_CONFIG_V4,
} from '../__fixtures__'
import { migrate } from '../migrate'

describe('config migration', () => {
  it('should migrate version 0 to latest', () => {
    const v0Config = MOCK_CONFIG_V0
    const result = migrate(v0Config)

    expect(result.version).toBe(4)
    expect(result).toEqual(MOCK_CONFIG_V4)
  })

  it('should migrate version 1 to latest', () => {
    const v1Config = MOCK_CONFIG_V1
    const result = migrate(v1Config)

    expect(result.version).toBe(4)
    expect(result).toEqual(MOCK_CONFIG_V4)
  })

  it('should migrate version 2 to latest', () => {
    const v2Config = MOCK_CONFIG_V2
    const result = migrate(v2Config)

    expect(result.version).toBe(4)
    expect(result).toEqual(MOCK_CONFIG_V4)
  })

  it('should migrate version 3 to latest', () => {
    const v3Config = MOCK_CONFIG_V3
    const result = migrate(v3Config)

    expect(result.version).toBe(4)
    expect(result).toEqual(MOCK_CONFIG_V4)
  })

  it('should keep version 4 unchanged', () => {
    const v4Config = {
      ...MOCK_CONFIG_V4,
      labware: {
        //  @ts-expect-error(bc, 2022-01-21): will be fixed by config TS types from app?
        ...MOCK_CONFIG_V3.labware,
        showLabwareOffsetCodeSnippets: false,
      },
    }
    const result = migrate(v4Config)

    expect(result.version).toBe(4)
    expect(result).toEqual(v4Config)
  })
})
