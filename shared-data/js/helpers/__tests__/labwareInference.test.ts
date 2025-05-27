import { describe, expect, it } from 'vitest'

import {
  getIfConsistent,
  getSpacingIfUniform,
  getUniqueWellProperties,
} from '../labwareInference'

import type {
  LabwareDefinition,
  LabwareDefinition2,
  LabwareDefinition3,
} from '../..'

describe('getUniqueWellProperties', () => {
  it('computes well offset properties from schema 2 labware', () => {
    const definition: Partial<LabwareDefinition2> = {
      schemaVersion: 2,
      dimensions: {
        yDimension: 100,
        xDimension: 200,
        zDimension: 50,
      },
      cornerOffsetFromSlot: {
        x: 999,
        y: 999,
        z: 999,
      },
      wells: {
        A1: {
          shape: 'circular',
          depth: 1,
          diameter: 1,
          totalLiquidVolume: 1,
          x: 10,
          y: 90,
          z: 49,
        },
        B1: {
          shape: 'circular',
          depth: 1,
          diameter: 1,
          totalLiquidVolume: 1,
          x: 10,
          y: 80,
          z: 49,
        },
        A2: {
          shape: 'circular',
          depth: 1,
          diameter: 1,
          totalLiquidVolume: 1,
          x: 20,
          y: 90,
          z: 49,
        },
        B2: {
          shape: 'circular',
          depth: 1,
          diameter: 1,
          totalLiquidVolume: 1,
          x: 20,
          y: 80,
          z: 49,
        },
      },
      ordering: [
        ['A1', 'B1'],
        ['A2', 'B2'],
      ],
      groups: [{ wells: ['A1', 'A2', 'A2', 'B2'], metadata: {} }],
    }

    const [result] = getUniqueWellProperties(definition as LabwareDefinition)
    expect({
      xOffsetFromLeft: result.xOffsetFromLeft,
      yOffsetFromBack: result.yOffsetFromBack,
      xSpacing: result.xSpacing,
      ySpacing: result.ySpacing,
    }).toStrictEqual({
      xOffsetFromLeft: 10,
      yOffsetFromBack: 10,
      xSpacing: 10,
      ySpacing: 10,
    })
  })

  it('computes well offset properties from schema 3 labware', () => {
    const definition: Partial<LabwareDefinition3> = {
      schemaVersion: 3,
      extents: {
        total: {
          backLeftBottom: {
            x: 100,
            y: 200,
            z: 0,
          },
          frontRightTop: {
            x: 300,
            y: 100,
            z: 50,
          },
        },
        footprint: {} as any,
      },
      wells: {
        A1: {
          shape: 'circular',
          depth: 1,
          diameter: 1,
          totalLiquidVolume: 1,
          x: 110,
          y: 190,
          z: 49,
        },
        B1: {
          shape: 'circular',
          depth: 1,
          diameter: 1,
          totalLiquidVolume: 1,
          x: 110,
          y: 180,
          z: 49,
        },
        A2: {
          shape: 'circular',
          depth: 1,
          diameter: 1,
          totalLiquidVolume: 1,
          x: 120,
          y: 190,
          z: 49,
        },
        B2: {
          shape: 'circular',
          depth: 1,
          diameter: 1,
          totalLiquidVolume: 1,
          x: 120,
          y: 180,
          z: 49,
        },
      },
      ordering: [
        ['A1', 'B1'],
        ['A2', 'B2'],
      ],
      groups: [{ wells: ['A1', 'A2', 'A2', 'B2'], metadata: {} }],
    }

    const [result] = getUniqueWellProperties(definition as LabwareDefinition)
    expect({
      xOffsetFromLeft: result.xOffsetFromLeft,
      yOffsetFromBack: result.yOffsetFromBack,
      xSpacing: result.xSpacing,
      ySpacing: result.ySpacing,
    }).toStrictEqual({
      xOffsetFromLeft: 10,
      yOffsetFromBack: 10,
      xSpacing: 10,
      ySpacing: 10,
    })
  })
})

describe('getSpacingIfUniform', () => {
  const testCases = [
    {
      testLabel: '1 well case: return 0',
      wells: [{ x: 10 }],
      expected: 0,
    },
    {
      testLabel: '2 well case',
      wells: [{ x: 10 }, { x: 20 }],
      expected: 10,
    },
    {
      testLabel:
        '2 well case with overlapping wells (eg, single-column labware): return 0',
      wells: [{ x: 10 }, { x: 10 }],
      expected: 0,
    },
    {
      testLabel: '3 well case',
      wells: [{ x: 0 }, { x: 25 }, { x: 50 }],
      expected: 25,
    },
    {
      testLabel:
        '3 well case with overlapping wells (eg, single-column labware): return 0',
      wells: [{ x: 10 }, { x: 10 }, { x: 10 }],
      expected: 0,
    },
    {
      testLabel: '3 well case: out of order is non-uniform, return null',
      wells: [{ x: 50 }, { x: 0 }, { x: 25 }],
      expected: null,
    },
    {
      testLabel: '3 well case: non-uniform with some duplicate values',
      wells: [
        { x: 0 },
        { x: 25 },
        { x: 25, spam: 'spam' },
        { x: 50 },
        { x: 50, foo: 'foo' },
      ],
      expected: 25,
    },
    {
      testLabel: 'returns null if wells have irregular spacing',
      wells: [{ x: 10 }, { x: 20 }, { x: 21 }],
      expected: null,
    },
    {
      testLabel: 'returns 0 with no wells',
      wells: [],
      expected: 0,
    },
  ]
  testCases.forEach(({ wells, expected, testLabel }) => {
    it(testLabel, () => {
      expect(getSpacingIfUniform(wells as any[], 'x')).toBe(expected)
    })
  })
})

describe('getIfConsistent', () => {
  it('deep equal', () => {
    const items = [
      { a: 123, b: [1, 2, [3]] },
      { a: 123, b: [1, 2, [3]] },
      { a: 123, b: [1, 2, [3]] },
    ]
    expect(getIfConsistent(items)).toEqual(items[0])
  })

  it('deep difference', () => {
    const items = [
      { a: 123, b: [1, 2, [3]] },
      { a: 123, b: [1, 2, [999999]] },
      { a: 123, b: [1, 2, [3]] },
    ]
    expect(getIfConsistent(items)).toBe(null)
  })
})
