import { describe, expect, it } from 'vitest'

import { getLabwareViewBox, getSchema2Dimensions } from '../..'

import type { LabwareDefinition2, LabwareDefinition3 } from '../..'

describe('getSchema2Dimensions()', () => {
  it('should handle schema 2 definitions', () => {
    const definition: Partial<LabwareDefinition2> = {
      schemaVersion: 2,
      dimensions: {
        xDimension: 12.34,
        yDimension: 56.78,
        zDimension: 90.12,
      },
    }
    const result = getSchema2Dimensions(definition as LabwareDefinition2)
    expect(result).toStrictEqual({
      xDimension: 12.34,
      yDimension: 56.78,
      zDimension: 90.12,
    })
  })
  it('should handle schema 3 definitions', () => {
    const definition: Partial<LabwareDefinition3> = {
      schemaVersion: 3,
      extents: {
        total: {
          backLeftBottom: {
            x: -0.1,
            y: 2.0,
            z: -0.3,
          },
          frontRightTop: {
            x: 1.0,
            y: -0.2,
            z: 3.0,
          },
        },
        footprint: {} as any,
      },
    }
    const result = getSchema2Dimensions(definition as LabwareDefinition3)
    expect(result).toStrictEqual({
      xDimension: 1.1,
      yDimension: 2.2,
      zDimension: 3.3,
    })
  })
})

describe('getLabwareViewBox()', () => {
  it('should handle schema 2 definitions', () => {
    const definition: Partial<LabwareDefinition2> = {
      schemaVersion: 2,
      dimensions: {
        xDimension: 200,
        yDimension: 100,
        zDimension: 10,
      },
      cornerOffsetFromSlot: {
        // Should not affect result.
        x: 999,
        y: 999,
        z: 999,
      },
    }
    const result = getLabwareViewBox(definition as LabwareDefinition2)
    const expectedResult: typeof result = {
      minX: 0,
      minY: 0,
      xDimension: 200,
      yDimension: 100,
    }
    expect(result).toStrictEqual(expectedResult)
  })
  it('should handle schema 3 definitions', () => {
    const definition: Partial<LabwareDefinition3> = {
      schemaVersion: 3,
      extents: {
        total: {
          backLeftBottom: {
            x: -20,
            y: 90,
            z: 0,
          },
          frontRightTop: {
            x: 180,
            y: -10,
            z: 10,
          },
        },
        footprint: {} as any,
      },
    }
    const result = getLabwareViewBox(definition as LabwareDefinition3)
    const expectedResult: typeof result = {
      minX: -20,
      minY: -10,
      xDimension: 200,
      yDimension: 100,
    }
    expect(result).toStrictEqual(expectedResult)
  })
})
