import {getSelectedWellsCommonValues} from '../'

let ingredLocations
let selectedLabwareId

beforeEach(() => {
  selectedLabwareId = 'labwareId'

  ingredLocations = {
    labwareId: {
      A1: {'ingred1': {volume: 115}},
      A2: {'ingred1': {volume: 111}},
      A3: {'ingred2': {volume: 155}},
      A4: {'ingred2': {volume: 105}, 'ingred1': {volume: 10}},
      // rest empty
    },
  }
})

describe('getSelectedWellsCommonValues', () => {
  test('labware id not in ingredientLocations', () => {
    const selectedWells = {A1: 'A1'}
    const selectedLabwareId = 'badLabwareId'

    const result = getSelectedWellsCommonValues.resultFunc(
      selectedWells,
      selectedLabwareId,
      ingredLocations
    )

    expect(result.ingredientId).toBe(null)
  })

  test('no selected labware', () => {
    const selectedWells = {A1: 'A1'}
    const selectedLabwareId = null

    const result = getSelectedWellsCommonValues.resultFunc(
      selectedWells,
      selectedLabwareId,
      ingredLocations
    )

    expect(result.ingredientId).toBe(null)
  })

  test('all selected wells same ingred: return ingred group id', () => {
    const selectedWells = {A1: 'A1', 'A2': 'A2'}

    const result = getSelectedWellsCommonValues.resultFunc(
      selectedWells,
      selectedLabwareId,
      ingredLocations
    )

    expect(result.ingredientId).toBe('ingred1')
  })

  test('2 well different ingreds: return null', () => {
    const selectedWells = {'A2': 'A2', A3: 'A3'}

    const result = getSelectedWellsCommonValues.resultFunc(
      selectedWells,
      selectedLabwareId,
      ingredLocations
    )

    expect(result.ingredientId).toBe(null)
  })

  test('2 well one empty: return null', () => {
    const selectedWells = {'A2': 'A2', A6: 'A6'}

    const result = getSelectedWellsCommonValues.resultFunc(
      selectedWells,
      selectedLabwareId,
      ingredLocations
    )

    expect(result.ingredientId).toBe(null)
  })

  test('1 well mixed ingreds: return null', () => {
    const selectedWells = {'A4': 'A4'}

    const result = getSelectedWellsCommonValues.resultFunc(
      selectedWells,
      selectedLabwareId,
      ingredLocations
    )

    expect(result.ingredientId).toBe(null)
  })
})
