// @flow
import { getExportedFileSchemaVersion } from '../selectors/fileCreator'

describe('getExportedFileSchemaVersion selector', () => {
  it('should return 5 when getRequiresAtLeastV5 is true', () => {
    // $FlowFixMe TODO(SA, 2020-08-26): Flow doesn't have type for resultFunc
    expect(getExportedFileSchemaVersion.resultFunc(false, true)).toBe(5)
    // $FlowFixMe TODO(SA, 2020-08-26): Flow doesn't have type for resultFunc
    expect(getExportedFileSchemaVersion.resultFunc(true, true)).toBe(5)
  })
  it('should return 4 when getRequiresAtLeastV4 is true and getRequiresAtLeastV5 is false', () => {
    expect(getExportedFileSchemaVersion.resultFunc(true, false)).toBe(4)
  })
  it('should return 3 when neither is true', () => {
    expect(getExportedFileSchemaVersion.resultFunc(false, false)).toBe(3)
  })
})
