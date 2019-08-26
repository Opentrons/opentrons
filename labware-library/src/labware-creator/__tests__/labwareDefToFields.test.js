// @flow
import labwareDefToFields from '../labwareDefToFields'
import fixtureRegularExample1 from '@opentrons/shared-data/labware/fixtures/2/fixture_regular_example_1'
import fixtureIrregularExample1 from '@opentrons/shared-data/labware/fixtures/2/fixture_irregular_example_1'

jest.mock('../../definitions')

describe('labwareDefToFields', () => {
  test('fixture_regular_example_1', () => {
    const def = fixtureRegularExample1
    const result = labwareDefToFields(def)
    expect(result).toEqual({
      labwareType: null,
      tubeRackInsertLoadName: null,
      aluminumBlockType: null,
      aluminumBlockChildType: null,

      footprintXDimension: String(def.dimensions.xDimension),
      footprintYDimension: String(def.dimensions.yDimension),
      labwareZDimension: String(def.dimensions.zDimension),

      gridRows: '1',
      gridColumns: '2',
      gridSpacingX: '10',
      gridSpacingY: null, // only single row, no Y spacing
      gridOffsetX: '10',
      gridOffsetY: '75.48',

      homogeneousWells: 'true',
      regularRowSpacing: 'true',
      regularColumnSpacing: 'true',

      wellVolume: '100',
      wellBottomShape: null, // TODO IMMEDIATELY: rethink this field?
      wellDepth: '40',
      wellShape: 'circular',

      wellDiameter: '30',

      // used with rectangular well shape only
      wellXDimension: null,
      wellYDimension: null,

      brand: 'opentrons',
      brandId: 't40u9sernisofsea',

      loadName: def.parameters.loadName,
      displayName: def.metadata.displayName,

      pipetteName: null,
    })
  })

  test('fixture_irregular_example_1 should return null (not yet supported)', () => {
    const def = fixtureIrregularExample1
    const result = labwareDefToFields(def)
    expect(result).toEqual(null)
  })
})
