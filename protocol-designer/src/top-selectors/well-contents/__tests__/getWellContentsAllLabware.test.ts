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
  mockDestLabware: { def: fixture_96_plate as LabwareDefinition2 },
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
    singleIngredResult = getWellContentsAllLabware.resultFunc(
      labwareEntities as any,
      ingredsByLabwareXXSingleIngred,
      'container1Id', // selected labware id
      { A1: null, B1: null }, // selected
      { A3: null } // highlighted
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
    const result = getWellContentsAllLabware.resultFunc(
      labwareEntities as any,
      ingredsByLabwareXXSingleIngred,
      null, // selected labware id
      { A1: null, B1: null }, // selected
      { A3: null } // highlighted
    )
    expect(result.container1Id?.A1.selected).toStrictEqual(false)
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
      mockDestLabware: {
        stack: ['mockDestLabware', 'C2'],
      },
      mockTiprack: {
        stack: ['mockTiprack', 'B1'],
      },
      container1Id: {
        stack: ['container1Id', 'mockDestLabware'],
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
    mockDestLabware: {
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

  it('selects well contents of all labware in stack (for Plate props)', () => {
    const singleIngredResultStack = getWellContentsForLabwareStack.resultFunc(
      labwareEntities as any,
      mockRobotState,
      ingredsByLabwareXXSingleIngredStack as any,
      'container1Id', // selected labware id
      { A1: null, B1: null }, // selected
      { A3: null } // highlighted
    )

    expect(singleIngredResultStack).toMatchObject({
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
      mockDestLabware: {
        A1: {
          ...defaultWellContents,
          selected: true,
          maxVolume: container1MaxVolume,
        },
      },
    })
  })
})
