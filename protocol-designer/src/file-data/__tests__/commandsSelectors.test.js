import { getLabwareLiquidState } from '../selectors'
jest.mock('../../labware-defs/utils')

let labwareEntities
let ingredLocs

beforeEach(() => {
  // TODO Ian 2019-04-12: create representative fixtures, don't use real defs
  labwareEntities = {
    FIXED_TRASH_ID: {
      def: require('@opentrons/shared-data/definitions2/opentrons_1_trash_1.1_l.json'),
    },
    wellPlateId: {
      def: require('@opentrons/shared-data/definitions2/generic_96_wellplate_380_ul.json'),
    },
    troughId: {
      def: require('@opentrons/shared-data/definitions2/usa_scientific_12_trough_22_ml.json'),
    },
  }

  ingredLocs = {
    wellPlateId: {
      A1: { '0': { volume: 100 } },
      B1: { '0': { volume: 150 } },
    },
    troughId: {
      A1: { '0': { volume: 105 } },
      A2: { '0': { volume: 155 } },
      A3: { '1': { volume: 115 } },
      A6: { '1': { volume: 111 } },
    },
  }
})

function hasAllWellKeys(result) {
  // make sure each labware has keys for all wells added in
  expect(Object.keys(result.wellPlateId).length).toBe(96)
  expect(Object.keys(result.troughId).length).toBe(12)
  expect(Object.keys(result.FIXED_TRASH_ID).length).toBe(1)
}

describe('getLabwareLiquidState', () => {
  test('no labware + no ingreds', () => {
    expect(getLabwareLiquidState.resultFunc({}, {})).toEqual({})
  })

  test('labware + no ingreds: generate empty well keys', () => {
    const result = getLabwareLiquidState.resultFunc({}, labwareEntities)

    hasAllWellKeys(result)
  })

  test('selects liquids with multiple ingredient groups & multiple labware: generate all well keys', () => {
    const result = getLabwareLiquidState.resultFunc(ingredLocs, labwareEntities)

    expect(result).toMatchObject(ingredLocs)

    hasAllWellKeys(result)
  })
})
