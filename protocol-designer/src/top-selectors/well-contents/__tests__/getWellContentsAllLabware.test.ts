import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fixture_24_tuberack,
  fixture_96_plate,
  fixture_trash,
} from '@opentrons/shared-data/labware/fixtures/2'

import {
  getWellContentsAllLabware,
  getWellContentsForLabwareStack,
} from '../getWellContentsAllLabware'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  LabwareEntities,
  LabwareLiquidState,
} from '@opentrons/step-generation'

vi.mock('../../../labware-defs/utils')

const baseIngredFields = {
  groupId: '0',
  name: 'Some Ingred',
  description: null,
  serialize: false,
}

const labwareEntities = {
  FIXED_TRASH_ID: { def: fixture_trash as LabwareDefinition2 },
  container1Id: { def: fixture_96_plate as LabwareDefinition2 },
  container2Id: { def: fixture_96_plate as LabwareDefinition2 },
  container3Id: { def: fixture_24_tuberack as LabwareDefinition2 },
}

describe('getWellContentsAllLabware', () => {
  const container1MaxVolume = fixture_96_plate.wells.A1.totalLiquidVolume
  let labwareEntities: LabwareEntities
  let ingredsByLabwareXXSingleIngred: LabwareLiquidState
  let defaultWellContents: { highlighted: boolean; selected: boolean }
  let singleIngredResult: Record<string, any>

  beforeEach(() => {
    ingredsByLabwareXXSingleIngred = {
      container1Id: {
        0: {
          ...baseIngredFields,
          wells: {
            // @ts-expect-error(sa, 2021-6-22): structure of ingredsByLabwareXXSingleIngred does not match LabwareLiquidState
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

    // @ts-expect-error(sa, 2021-6-22): resultFunc not part of Selector type
    singleIngredResult = getWellContentsAllLabware.resultFunc(
      labwareEntities,
      ingredsByLabwareXXSingleIngred,
      'container1Id', // selected labware id
      { A1: 'A1', B1: 'B1' }, // selected
      { A3: 'A3' } // highlighted
    )
  })

  it('containers have expected number of wells', () => {
    expect(Object.keys(singleIngredResult.container1Id).length).toEqual(96)
    expect(Object.keys(singleIngredResult.container2Id).length).toEqual(96)
  })

  it('selects well contents of all labware (for Plate props)', () => {
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

  it('selects well contents of all labware in stack (for Plate props)', () => {
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

  it('no selected wells when labwareId is not selected', () => {
    // @ts-expect-error(sa, 2021-6-22): resultFunc not part of Selector type
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

describe('getWellContentsForLabwareStack', () => {
  const ingredsByLabwareXXSingleIngredStack = {
    container1Id: {
      0: {
        ...baseIngredFields,
        wells: {
          // @ts-expect-error(sa, 2021-6-22): structure of ingredsByLabwareXXSingleIngredStack does not match LabwareLiquidState
          A1: { volume: 100 },
          B1: { volume: 150 },
        },
      },
    },
    container2Id: {
      0: {
        ...baseIngredFields,
        wells: {
          // @ts-expect-error(sa, 2021-6-22): structure of ingredsByLabwareXXSingleIngredStack does not match LabwareLiquidState
          A1: { volume: 100 },
          B1: { volume: 150 },
        },
      },
    },
    container3Id: {},
    FIXED_TRASH_ID: {},
  }

  const singleIngredResultStack = getWellContentsForLabwareStack.resultFunc(
    labwareEntities,
    ingredsByLabwareXXSingleIngredStack,
    'container1Id', // selected labware id
    { A1: 'A1', B1: 'B1' }, // selected
    { A3: 'A3' } // highlighted
  )

  it('selects well contents of all labware in stack (for Plate props)', () => {
    expect(singleIngredResultStack).toMatchObject(singleIngredResult)
  })
})
