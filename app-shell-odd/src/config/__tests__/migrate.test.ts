// config migration tests
import {
  MOCK_CONFIG_V12,
} from '../__fixtures__'
import { migrate } from '../migrate'

describe('config migration', () => {
  it('should keep version 12', () => {
    const v12Config = MOCK_CONFIG_V12
    const result = migrate(v12Config)

    expect(result.version).toBe(12)
    expect(result).toEqual(v12Config)
  })
})
