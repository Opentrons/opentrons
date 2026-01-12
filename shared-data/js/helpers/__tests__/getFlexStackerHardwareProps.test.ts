import { describe, expect, it, vi } from 'vitest'

import {
  fixtureTiprack1000ul,
  FLEX_STACKER_MODULE_V1,
  getSchema2Dimensions,
  MAGNETIC_MODULE_V1,
} from '../..'
import {
  getHeightOfLabwareStackFromDefinitions,
  getLabwareOverlapOffset,
  getModuleMaxFillHeight,
  getStackerMaxPoolCountByHeight,
} from '../getFlexStackerHardwareProps'

import type { LabwareDefinition2 } from '../..'

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

  it('should console an error if the module model is invalid', () => {
    const mockConsoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const result = getStackerMaxPoolCountByHeight(MAGNETIC_MODULE_V1, 100, 0)
    expect(result).toBe(0)
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Invalid module model for max pool count by height: magneticModuleV1'
    )
  })
})

describe('getLabwareOverlapOffset()', () => {
  const mockLabwareDefinition = fixtureTiprack1000ul as LabwareDefinition2

  it('should return the labware overlap offset for a given module model', () => {
    const result = getLabwareOverlapOffset(
      mockLabwareDefinition,
      'labware-name'
    )
    expect(result).toStrictEqual({ x: 0, y: 0, z: 0 })
  })

  it('should console an error if the module model is invalid', () => {
    const mockConsoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const result = getLabwareOverlapOffset(
      mockLabwareDefinition,
      'labware-name'
    )
    expect(result).toStrictEqual({ x: 0, y: 0, z: 0 })
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Invalid module model for labware overlap offset: magneticModuleV1'
    )
  })
})

describe('getHeightOfLabwareStackFromDefinitions()', () => {
  it('should return the height of a stack of labware from definitions', () => {
    const mockLabwareDefinition = fixtureTiprack1000ul as LabwareDefinition2
    const result = getHeightOfLabwareStackFromDefinitions([
      mockLabwareDefinition,
    ])
    expect(result).toBe(getSchema2Dimensions(mockLabwareDefinition).zDimension)
  })

  it('should return 0 if the definitions are empty', () => {
    const result = getHeightOfLabwareStackFromDefinitions([])
    expect(result).toBe(0)
  })

  it('should return the height of a stack of labware from definitions', () => {
    const mockLabwareDefinition = fixtureTiprack1000ul as LabwareDefinition2
    const result = getHeightOfLabwareStackFromDefinitions([
      mockLabwareDefinition,
      mockLabwareDefinition,
    ])
    expect(result).toBe(
      getSchema2Dimensions(mockLabwareDefinition).zDimension * 2
    )
  })
})
