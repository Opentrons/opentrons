import fixture_12_trough from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough.json'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import fixture_trash from '@opentrons/shared-data/labware/fixtures/2/fixture_trash.json'

import { getLabwareLiquidState } from '../selectors'
jest.mock('../../labware-defs/utils')

let labwareEntities
let ingredLocs

beforeEach(() => {
  labwareEntities = {
    FIXED_TRASH_ID: {
      def: fixture_trash,
    },
    wellPlateId: {
      def: fixture_96_plate,
    },
    troughId: {
      def: fixture_12_trough,
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
  it('no labware + no ingreds', () => {
    expect(getLabwareLiquidState.resultFunc({}, {})).toEqual({})
  })

  it('labware + no ingreds: generate empty well keys', () => {
    const result = getLabwareLiquidState.resultFunc({}, labwareEntities)

    hasAllWellKeys(result)
  })

  it('selects liquids with multiple ingredient groups & multiple labware: generate all well keys', () => {
    const result = getLabwareLiquidState.resultFunc(ingredLocs, labwareEntities)

    expect(result).toMatchObject(ingredLocs)

    hasAllWellKeys(result)
  })
})
