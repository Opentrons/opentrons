import { describe, expect, it } from 'vitest'

import {
  fixtureTiprack1000ul,
  FLEX_STACKER_MODULE_V1,
  LabwareDefinition2,
  MAGNETIC_MODULE_V1,
} from '../..'
import {
  getLabwareOverlapOffset,
  getModuleMaxFillHeight,
  getStackerMaxPoolCountByHeight,
} from '../getFlexStackerHardwareProps'

describe('getModuleMaxFillHeight()', () => {
  it('should return the max fill height for a given module model', () => {
    expect(getModuleMaxFillHeight(FLEX_STACKER_MODULE_V1)).toBe(612.75)
  })
})

describe('getStackerMaxPoolCountByHeight()', () => {
  it('should return the max pool count by height for a given module model', () => {
    expect(getStackerMaxPoolCountByHeight(FLEX_STACKER_MODULE_V1, 100, 0)).toBe(
      6
    )
  })

  it('should throw an error if the module model is invalid', () => {
    expect(() =>
      getStackerMaxPoolCountByHeight(MAGNETIC_MODULE_V1, 100, 0)
    ).toThrow(
      'Invalid module model for max pool count by height: magneticModuleV1'
    )
  })
})

describe('getLabwareOverlapOffset()', () => {
  const mockLabwareDefinition = fixtureTiprack1000ul as LabwareDefinition2

  it('should return the labware overlap offset for a given module model', () => {
    const result = getLabwareOverlapOffset(
      FLEX_STACKER_MODULE_V1,
      mockLabwareDefinition,
      'labware-name'
    )
    expect(result).toStrictEqual({ x: 0, y: 0, z: 0 })
  })

  it.only('should throw an error if the module model is invalid', () => {
    expect(() =>
      getLabwareOverlapOffset(
        MAGNETIC_MODULE_V1,
        mockLabwareDefinition,
        'labware-name'
      )
    ).toThrow(
      'Invalid module model for labware overlap offset: magneticModuleV1'
    )
  })
})
