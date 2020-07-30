// @flow
// config migration tests
import { MOCK_CONFIG_V0, MOCK_CONFIG_V2 } from '../__fixtures__'
import { migrate } from '../migrate'

describe('config migration', () => {
  it('should migrate version 0 to latest', () => {
    const v0Config = MOCK_CONFIG_V0
    const result = migrate(v0Config)

    expect(result.version).toBe(2)
    expect(result).toEqual(MOCK_CONFIG_V2)
  })

  it('should keep version 2 unchanged', () => {
    const v2Config = {
      ...MOCK_CONFIG_V2,
      calibration: {
        ...MOCK_CONFIG_V2.calibration,
        useTrashSurfaceForTipCal: true,
      },
    }
    const result = migrate(v2Config)

    expect(result.version).toBe(2)
    expect(result).toEqual(v2Config)
  })
})
