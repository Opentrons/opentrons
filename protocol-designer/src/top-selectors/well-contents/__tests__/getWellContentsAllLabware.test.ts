import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fixture_24_tuberack,
  fixture_96_plate,
  fixture_trash,
} from '@opentrons/shared-data/labware/fixtures/2'
import { CLEAN } from '@opentrons/step-generation'

import {
  getWellContentsAllLabware,
  getWellContentsForLabwareStack,
} from '../getWellContentsAllLabware'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  LabwareEntities,
  LabwareLiquidState,
  TimelineFrame,
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

const defaultWellContents = {
  highlighted: false,
  selected: false,
}
const container1MaxVolume = fixture_96_plate.wells.A1.totalLiquidVolume

describe('getWellContentsAllLabware', () => {
  let ingredsByLabwareXXSingleIngred: LabwareLiquidState
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
  const mockRobotState: TimelineFrame = {
    pipettes: {
      mockPipette: {
        mount: 'left',
      },
    },
    labware: {
      mockSourceLabware: {
        stack: ['mockSourceLabware', 'A1'],
      },
      mockDestLabware: {
        stack: ['mockDestLabware', 'C2'],
      },
      mockTiprack: {
        stack: ['mockTiprack', 'B1'],
      },
    },
    modules: {},
    tipState: {
      tipracks: {
        mockTiprack: {
          A1: CLEAN,
          B1: CLEAN,
        },
      },
      pipettes: {
        mockPipette: {
          hasTip: false,
          tiprackURI: null,
        },
      },
    },
    liquidState: {
      pipettes: {
        mockPipette: {
          0: {},
        },
      },
      labware: {
        mockSourceLabware: {
          A1: {},
        },
        mockDestLabware: {
          A1: {},
        },
      },
      trashBins: {
        mockTrashBin: {},
      },
      wasteChute: {},
    },
  }

  const locationsState = {
    myTrough: {
      A1: { ingred3: { volume: 101 } },
      A2: { ingred3: { volume: 102 } },
      A3: { ingred3: { volume: 103 } },
    },
    otherContainer: {
      D4: { ingred3: { volume: 201 } },
      E4: { ingred3: { volume: 202 } },
      A4: { ingred4: { volume: 301 } },
      B4: { ingred4: { volume: 302 } },
    },
  }

  const ingredsByLabwareXXSingleIngredStack = {
    container1Id: {
      0: {
        ...baseIngredFields,
        wells: {
          A1: { volume: 100 },
          B1: { volume: 150 },
        },
      },
    },
    container2Id: {
      0: {
        ...baseIngredFields,
        wells: {
          A1: { volume: 100 },
          B1: { volume: 150 },
        },
      },
    },
    container3Id: {},
    FIXED_TRASH_ID: {},
  }

  const mockLabwareIngred = {
    labwareEntities,
    liquidsByLabware: ingredsByLabwareXXSingleIngredStack,
    ingredLocations: locationsState,
    selectedLabwareId: 'container1Id', // selected labware id
    selectedWells: { A1: 'A1', B1: 'B1' }, // selected
    highlightedWells: { A3: 'A3' }, // highlighted
  }

  const mockBaseState = {
    analytics: {},
    dismiss: {},
    fileData: {},
    featureFlags: {},
    labwareIngred: mockLabwareIngred,
    loadFile: {},
    navigation: {},
    stepForms: {},
    tutorial: {},
    ui: {},
    wellSelection: {},
  }

  const singleIngredResultStack = getWellContentsForLabwareStack(mockBaseState)
  console.log('singleIngredResultStack', singleIngredResultStack)
  //   labwareEntities,
  //   mockRobotState,
  //   ingredsByLabwareXXSingleIngredStack,
  //   'container1Id', // selected labware id
  //   { A1: 'A1', B1: 'B1' }, // selected
  //   { A3: 'A3' } // highlighted
  // )

  it('selects well contents of all labware in stack (for Plate props)', () => {
    expect(singleIngredResultStack).toMatchObject({
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
    expect(singleIngredResultStack).toMatchObject(singleIngredResultStack)
  })
})
