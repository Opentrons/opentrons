// @flow
import fixture96Plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate'
import fixtureIrregular from '@opentrons/shared-data/labware/fixtures/2/fixture_irregular_example_1'
import {
  getIfConsistent,
  getSpacingIfUniform,
  getUniqueWellProperties,
} from '../labwareInference'

describe('getSpacingIfUniform', () => {
  const testCases = [
    {
      testLabel: '2 well case',
      wells: [{ x: 10 }, { x: 20 }],
      expected: 10,
    },
    {
      testLabel: '2 well case: 0 spacing',
      wells: [{ x: 10 }, { x: 10 }],
      expected: null,
    },
    {
      testLabel: '3 well case',
      wells: [{ x: 0 }, { x: 25 }, { x: 50 }],
      expected: 25,
    },
    {
      testLabel: '3 well case: out of order is non-uniform, return null',
      wells: [{ x: 50 }, { x: 0 }, { x: 25 }],
      expected: null,
    },
    {
      testLabel: '3 well case: zero spacing, return null',
      wells: [{ x: 25 }, { x: 25 }, { x: 25 }],
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
      testLabel: 'returns null if only 1 well across axis',
      wells: [{ x: 10 }],
      expected: null,
    },
    {
      testLabel: 'returns null with no wells',
      wells: [],
      expected: null,
    },
  ]
  testCases.forEach(({ wells, expected, testLabel }) =>
    test(testLabel, () =>
      expect(getSpacingIfUniform((wells: Array<any>), 'x')).toBe(expected)
    )
  )
})

describe('getIfConsistent', () => {
  test('deep equal', () => {
    const items = [
      { a: 123, b: [1, 2, [3]] },
      { a: 123, b: [1, 2, [3]] },
      { a: 123, b: [1, 2, [3]] },
    ]
    expect(getIfConsistent(items)).toEqual(items[0])
  })

  test('deep difference', () => {
    const items = [
      { a: 123, b: [1, 2, [3]] },
      { a: 123, b: [1, 2, [999999]] },
      { a: 123, b: [1, 2, [3]] },
    ]
    expect(getIfConsistent(items)).toBe(null)
  })
})

describe('getUniqueWellProperties', () => {
  const defs = [fixture96Plate, fixtureIrregular]
  defs.forEach(def =>
    test(def.parameters.loadName, () => {
      expect(getUniqueWellProperties(def)).toMatchSnapshot()
    })
  )
})
