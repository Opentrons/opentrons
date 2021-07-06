import { getExportedFileSchemaVersion } from '../selectors/fileCreator'
describe('getExportedFileSchemaVersion selector', () => {
  it('should return 5 when getRequiresAtLeastV5 is true', () => {
    // @ts-expect-error(sa, 2021-6-15): resultFunc not part of Selector type
    expect(getExportedFileSchemaVersion.resultFunc(false, true)).toBe(5)
    // @ts-expect-error(sa, 2021-6-15): resultFunc not part of Selector type
    expect(getExportedFileSchemaVersion.resultFunc(true, true)).toBe(5)
  })
  it('should return 4 when getRequiresAtLeastV4 is true and getRequiresAtLeastV5 is false', () => {
    // @ts-expect-error(sa, 2021-6-15): resultFunc not part of Selector type
    expect(getExportedFileSchemaVersion.resultFunc(true, false)).toBe(4)
  })
  it('should return 3 when neither is true', () => {
    // @ts-expect-error(sa, 2021-6-15): resultFunc not part of Selector type
    expect(getExportedFileSchemaVersion.resultFunc(false, false)).toBe(3)
  })
})
