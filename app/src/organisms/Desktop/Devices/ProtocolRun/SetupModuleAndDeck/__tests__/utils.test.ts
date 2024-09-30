import { describe, it, expect } from 'vitest'
import { getFixtureImage } from '../utils'

describe('getFixtureImage', () => {
  it('should render the staging area image', () => {
    const result = getFixtureImage('stagingAreaRightSlot')
    expect(result).toEqual('/app/src/assets/images/staging_area_slot.png')
  })
  it('should render the waste chute image', () => {
    const result = getFixtureImage('wasteChuteRightAdapterNoCover')
    expect(result).toEqual('/app/src/assets/images/waste_chute.png')
  })
  it('should render the waste chute staging area image', () => {
    const result = getFixtureImage(
      'stagingAreaSlotWithWasteChuteRightAdapterCovered'
    )
    expect(result).toEqual(
      '/app/src/assets/images/waste_chute_with_staging_area.png'
    )
  })
  it('should render the trash bin image', () => {
    const result = getFixtureImage('trashBinAdapter')
    expect(result).toEqual('/app/src/assets/images/flex_trash_bin.png')
  })
})
