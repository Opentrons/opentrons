import {
  fixture96Plate,
  fixtureTrash,
  fixture24TubeRack,
} from '@opentrons/shared-data/fixtures'
import getWellContentsAllLabware from '../getWellContentsAllLabware'

jest.mock('../../../labware-defs/utils')

describe('getWellContentsAllLabware', () => {
  const container1MaxVolume = fixture96Plate.wells.A1.totalLiquidVolume
  let baseIngredFields
  let labwareEntities
  let ingredsByLabwareXXSingleIngred
  let defaultWellContents
  let singleIngredResult

  beforeEach(() => {
    baseIngredFields = {
      groupId: '0',
      name: 'Some Ingred',
      description: null,
      serialize: false,
    }

    labwareEntities = {
      FIXED_TRASH_ID: { def: fixtureTrash },
      container1Id: { def: fixture96Plate },
      container2Id: { def: fixture96Plate },
      container3Id: { def: fixture24TubeRack },
    }

    ingredsByLabwareXXSingleIngred = {
      container1Id: {
        '0': {
          ...baseIngredFields,
          wells: {
            A1: { volume: 100 },
            B1: { volume: 150 },
          },
        },
      },
      container2Id: {},
      container3Id: {},
      FIXED_TRASH_ID: {},
    }

    defaultWellContents = {
      highlighted: false,
      selected: false,
    }

    singleIngredResult = getWellContentsAllLabware.resultFunc(
      labwareEntities,
      ingredsByLabwareXXSingleIngred,
      'container1Id', // selected labware id
      { A1: 'A1', B1: 'B1' }, // selected
      { A3: 'A3' } // highlighted
    )
  })

  test('containers have expected number of wells', () => {
    expect(Object.keys(singleIngredResult.container1Id).length).toEqual(96)
    expect(Object.keys(singleIngredResult.container2Id).length).toEqual(96)
  })

  test('selects well contents of all labware (for Plate props)', () => {
    expect(singleIngredResult).toMatchObject({
      FIXED_TRASH_ID: {
        A1: defaultWellContents,
      },
      container2Id: {
        A1: defaultWellContents,
      },
      container3Id: {
        A1: defaultWellContents,
      },

      container1Id: {
        A1: {
          ...defaultWellContents,
          selected: true,
          maxVolume: container1MaxVolume,
        },
        A2: {
          ...defaultWellContents,
          maxVolume: container1MaxVolume,
        },
        B1: {
          ...defaultWellContents,
          selected: true,
          maxVolume: container1MaxVolume,
        },
        B2: {
          ...defaultWellContents,
          maxVolume: container1MaxVolume,
        },
      },
    })
  })

  test('no selected wells when labwareId is not selected', () => {
    const result = getWellContentsAllLabware.resultFunc(
      labwareEntities,
      ingredsByLabwareXXSingleIngred,
      null, // selected labware id
      { A1: 'A1', B1: 'B1' }, // selected
      { A3: 'A3' } // highlighted
    )
    expect(result.container1Id.A1.selected).toBe(false)
  })
})
