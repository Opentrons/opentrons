import {getLabwareLiquidState} from '../selectors'

let labwareState
let ingredLocs

beforeEach(() => {
  labwareState = {
    'FIXED_TRASH_ID': {
      type: 'fixed-trash',
      name: 'Trash',
      slot: '12',
    },
    wellPlateId: {
      slot: '10',
      type: '96-flat',
      name: 'Labware 1',
    },
    troughId: {
      slot: '8',
      type: 'trough-12row',
      name: 'Labware 2',
    },
  }

  ingredLocs = {
    wellPlateId: {
      A1: {'0': {volume: 100}},
      B1: {'0': {volume: 150}},
    },
    troughId: {
      A1: {'0': {volume: 105}},
      A2: {'0': {volume: 155}},
      A3: {'1': {volume: 115}},
      A6: {'1': {volume: 111}},
    },
  }
})

function hasAllWellKeys (result) {
  // make sure each labware has keys for all wells added in
  expect(Object.keys(result.wellPlateId).length).toBe(96)
  expect(Object.keys(result.troughId).length).toBe(12)
  expect(Object.keys(result.FIXED_TRASH_ID).length).toBe(1)
}

describe('getLabwareLiquidState', () => {
  test('no labware + no ingreds', () => {
    expect(getLabwareLiquidState.resultFunc(
      {},
      {}
    )).toEqual({})
  })

  test('labware + no ingreds: generate empty well keys', () => {
    const result = getLabwareLiquidState.resultFunc(
      {},
      labwareState
    )

    hasAllWellKeys(result)
  })

  test('selects liquids with multiple ingredient groups & multiple labware: generate all well keys', () => {
    const result = getLabwareLiquidState.resultFunc(
      ingredLocs,
      labwareState
    )

    expect(result).toMatchObject(ingredLocs)

    hasAllWellKeys(result)
  })
})
