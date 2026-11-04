import cloneDeep from 'lodash/cloneDeep'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fixture96Plate,
  FLEX_STACKER_D4_ADDRESSABLE_AREA,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
  getLabwareDefURI,
  SYSTEM_LOCATION,
} from '@opentrons/shared-data'

import {
  FLEX_STACKER_MODULE_INITIAL_STATE,
  HOPPER_STACKER_LOCATION,
} from '../../constants'
import { getInitialRobotStateStandard, makeContext } from '../../fixtures'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import {
  forFlexStackerEmpty,
  forFlexStackerFillItems,
  forFlexStackerRetrieve,
  forFlexStackerStore,
} from '../stackerUpdates'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { FlexStackerModuleState } from '../../types'

vi.mock('@opentrons/shared-data', async importOriginal => ({
  ...(await importOriginal()),
  getHeightOfLabwareStackFromDefinitions: vi.fn(),
  getStackerMaxPoolCountByHeight: vi.fn(),
  getLabwareOverlapOffset: vi.fn(),
}))

const LABWARE_ID = 'sourcePlateId'
const FLEX_STACKER_ID = 'flexStackerId'

const invariantContext = makeContext()
const robotState = getInitialRobotStateStandard(invariantContext)

describe('flex stacker state updates forFlexStackerEmpty', () => {
  const FLEX_STACKER_ID = 'flexStackerId'
  beforeEach(() => {
    robotState.modules[FLEX_STACKER_ID] = {
      slot: '1',
      moduleState: {
        type: FLEX_STACKER_MODULE_TYPE,
        labwareInHopper: [
          {
            primaryLabwareId: 'labware1',
            adapterLabwareId: null,
            lidLabwareId: null,
          },
          {
            primaryLabwareId: 'labware2',
            adapterLabwareId: null,
            lidLabwareId: null,
          },
        ],
        storedLabwareDetails: {
          primaryLabwareURI: LABWARE_ID,
        },
        labwareOnShuttle: null,
      },
    }
    robotState.labware = {
      [LABWARE_ID]: {
        stack: [LABWARE_ID, HOPPER_STACKER_LOCATION, FLEX_STACKER_ID, '1'],
      },
    }
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should remove the last item from the stored stacker list', () => {
    const props = {
      count: 1,
      moduleId: FLEX_STACKER_ID,
      strategy: 'logical' as const,
    }
    forFlexStackerEmpty(props, invariantContext, {
      robotState: robotState,
      warnings: [],
    })

    const moduleState = flexStackerStateGetter(robotState, FLEX_STACKER_ID)
    expect(moduleState!.labwareInHopper).toEqual([
      {
        primaryLabwareId: 'labware1',
        adapterLabwareId: null,
        lidLabwareId: null,
      },
    ])
    expect(robotState.labware).toEqual({
      [LABWARE_ID]: {
        stack: [LABWARE_ID, SYSTEM_LOCATION],
      },
    })
  })

  it('should remove all items from the stored stacker list if count is null', () => {
    const props = {
      moduleId: FLEX_STACKER_ID,
      strategy: 'logical' as const,
    }
    forFlexStackerEmpty(props, invariantContext, {
      robotState: robotState,
      warnings: [],
    })

    const moduleState = flexStackerStateGetter(robotState, FLEX_STACKER_ID)
    expect(moduleState?.labwareInHopper).toEqual([])
  })
})

describe('flex stacker state updates forFlexStackerRetrieve', () => {
  const invariantContext = makeContext()
  const robotState = getInitialRobotStateStandard(invariantContext)
  beforeEach(() => {
    robotState.modules[FLEX_STACKER_ID] = {
      slot: '1',
      moduleState: {
        type: FLEX_STACKER_MODULE_TYPE,
        labwareInHopper: [
          {
            primaryLabwareId: 'tiprack1Id',
            adapterLabwareId: null,
            lidLabwareId: null,
          },
          {
            primaryLabwareId: 'tiprack2Id',
            adapterLabwareId: null,
            lidLabwareId: null,
          },
        ],
        storedLabwareDetails: {
          primaryLabwareURI: LABWARE_ID,
        },
        labwareOnShuttle: {
          primaryLabwareId: 'tiprack4Id',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
      },
    }
  })

  it('should retrieve the labware from the stacker', () => {
    robotState.modules[FLEX_STACKER_ID] = {
      slot: '1',
      moduleState: {
        type: FLEX_STACKER_MODULE_TYPE,
        labwareInHopper: [
          {
            primaryLabwareId: 'tiprack1Id',
            adapterLabwareId: null,
            lidLabwareId: null,
          },
          {
            primaryLabwareId: 'tiprack2Id',
            adapterLabwareId: null,
            lidLabwareId: null,
          },
          {
            primaryLabwareId: 'tiprack3Id',
            adapterLabwareId: null,
            lidLabwareId: null,
          },
        ],
        storedLabwareDetails: {
          primaryLabwareURI: LABWARE_ID,
        },
        labwareOnShuttle: null,
      },
    }

    forFlexStackerRetrieve({ moduleId: FLEX_STACKER_ID }, invariantContext, {
      robotState,
      warnings: [],
    })

    const moduleState = flexStackerStateGetter(robotState, FLEX_STACKER_ID)
    expect(moduleState?.labwareOnShuttle).toEqual({
      primaryLabwareId: 'tiprack1Id',
      adapterLabwareId: null,
      lidLabwareId: null,
    })
    expect(moduleState?.labwareInHopper).toEqual([
      {
        primaryLabwareId: 'tiprack2Id',
        adapterLabwareId: null,
        lidLabwareId: null,
      },
      {
        primaryLabwareId: 'tiprack3Id',
        adapterLabwareId: null,
        lidLabwareId: null,
      },
    ])
    expect(robotState.labware.tiprack1Id).toEqual({
      stack: ['tiprack1Id', '1'],
    })
  })

  it('sets stackedOnNode to the stacker shuttle addressable area for the bottom retrieved labware', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    robotState.modules[FLEX_STACKER_ID] = {
      slot: 'D4',
      moduleState: {
        type: FLEX_STACKER_MODULE_TYPE,
        labwareInHopper: [
          {
            primaryLabwareId: 'tiprack1Id',
            adapterLabwareId: null,
            lidLabwareId: null,
          },
          {
            primaryLabwareId: 'tiprack2Id',
            adapterLabwareId: null,
            lidLabwareId: null,
          },
        ],
        storedLabwareDetails: {
          primaryLabwareURI: LABWARE_ID,
        },
        labwareOnShuttle: null,
      },
    }

    forFlexStackerRetrieve({ moduleId: FLEX_STACKER_ID }, invariantContext, {
      robotState,
      warnings: [],
    })

    expect(robotState.labware.tiprack1Id.stackedOnNode).toEqual({
      addressableAreaName: FLEX_STACKER_D4_ADDRESSABLE_AREA,
    })
    expect(robotState.labware.tiprack1Id.stack).toEqual(['tiprack1Id', 'D4'])
    warnSpy.mockRestore()
  })

  it('sets stackedOnNode chain when retrieving adapter-with-primary from hopper', () => {
    const ic = makeContext()
    const rs = cloneDeep(getInitialRobotStateStandard(ic))
    const primaryUri = ic.labwareEntities.tiprack4Id.labwareDefURI
    const adapterUri = ic.labwareEntities.tiprack4AdapterId.labwareDefURI
    rs.modules[FLEX_STACKER_ID] = {
      slot: 'D4',
      moduleState: {
        ...cloneDeep(FLEX_STACKER_MODULE_INITIAL_STATE),
        labwareInHopper: [
          {
            primaryLabwareId: 'tiprack4Id',
            adapterLabwareId: 'tiprack4AdapterId',
            lidLabwareId: null,
          },
        ],
        storedLabwareDetails: {
          primaryLabwareURI: primaryUri,
          adapterLabwareURI: adapterUri,
          lidLabwareURI: null,
        },
        labwareOnShuttle: null,
      } as FlexStackerModuleState,
    }

    forFlexStackerRetrieve({ moduleId: FLEX_STACKER_ID }, ic, {
      robotState: rs,
      warnings: [],
    })

    expect(rs.labware.tiprack4AdapterId.stackedOnNode).toEqual({
      addressableAreaName: FLEX_STACKER_D4_ADDRESSABLE_AREA,
    })
    expect(rs.labware.tiprack4Id.stackedOnNode).toEqual({
      labwareId: 'tiprack4AdapterId',
    })
  })
})

describe('forFlexStackerFillItems stackedOnNode', () => {
  it('assigns hopper stackedOnNode only to real labware ids (not hopper sentinel or module id)', () => {
    const ic = makeContext()
    const rs = cloneDeep(getInitialRobotStateStandard(ic))
    const moduleId = 'flexStackerFillTest'
    const plateDef = fixture96Plate as LabwareDefinition2
    const primaryUri = getLabwareDefURI(plateDef)
    ic.moduleEntities[moduleId] = {
      id: moduleId,
      type: FLEX_STACKER_MODULE_TYPE,
      model: FLEX_STACKER_MODULE_V1,
      pythonName: 'flex_stacker_fill',
    }
    ic.labwareEntities.fillTestLw = {
      id: 'fillTestLw',
      labwareDefURI: primaryUri,
      def: plateDef,
      pythonName: 'fill_test_lw',
    }
    rs.modules[moduleId] = {
      slot: 'D4',
      moduleState: {
        ...cloneDeep(FLEX_STACKER_MODULE_INITIAL_STATE),
        storedLabwareDetails: {
          primaryLabwareURI: primaryUri,
          adapterLabwareURI: null,
          lidLabwareURI: null,
        },
        labwareInHopper: [],
        labwareOnShuttle: null,
      } as FlexStackerModuleState,
    }
    rs.labware.fillTestLw = { stack: ['fillTestLw', 'offDeck'] }

    forFlexStackerFillItems({ moduleId, labware: ['fillTestLw'] }, ic, {
      robotState: rs,
      warnings: [],
    })

    expect(rs.labware.fillTestLw.stackedOnNode).toEqual({
      kind: 'inStackerHopper',
      moduleId,
    })
  })
})

describe('flex stacker state updates forFlexStackerStore', () => {
  beforeEach(() => {
    robotState.modules[FLEX_STACKER_ID] = {
      slot: '1',
      moduleState: {
        type: FLEX_STACKER_MODULE_TYPE,
        labwareInHopper: [
          {
            primaryLabwareId: 'tiprack1Id',
            adapterLabwareId: null,
            lidLabwareId: null,
          },
          {
            primaryLabwareId: 'tiprack2Id',
            adapterLabwareId: null,
            lidLabwareId: null,
          },
          {
            primaryLabwareId: 'tiprack3Id',
            adapterLabwareId: null,
            lidLabwareId: null,
          },
        ],
        storedLabwareDetails: {
          primaryLabwareURI: LABWARE_ID,
        },
        labwareOnShuttle: {
          primaryLabwareId: 'tiprack4Id',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
      },
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should store the labware in the stacker', () => {
    robotState.labware = {
      [LABWARE_ID]: {
        stack: [LABWARE_ID, SYSTEM_LOCATION],
      },
      tiprack4Id: {
        stack: ['tiprack4Id', FLEX_STACKER_ID, '1'],
      },
    }
    forFlexStackerStore(
      { moduleId: FLEX_STACKER_ID, strategy: 'automatic' },
      invariantContext,
      {
        robotState,
        warnings: [],
      }
    )

    const moduleState = flexStackerStateGetter(robotState, FLEX_STACKER_ID)
    expect(moduleState?.labwareOnShuttle).toBeNull()
    expect(moduleState?.labwareInHopper).toHaveLength(4)
    expect(robotState.labware.tiprack4Id.stack).toEqual([
      'tiprack4Id',
      HOPPER_STACKER_LOCATION,
      FLEX_STACKER_ID,
      '1',
    ])
  })

  it('sets stackedOnNode to inStackerHopper for labware moved from the shuttle into the hopper', () => {
    robotState.labware = {
      [LABWARE_ID]: {
        stack: [LABWARE_ID, SYSTEM_LOCATION],
      },
      tiprack4Id: {
        stack: ['tiprack4Id', FLEX_STACKER_ID, '1'],
      },
    }
    forFlexStackerStore(
      { moduleId: FLEX_STACKER_ID, strategy: 'automatic' },
      invariantContext,
      {
        robotState,
        warnings: [],
      }
    )

    expect(robotState.labware.tiprack4Id.stackedOnNode).toEqual({
      kind: 'inStackerHopper',
      moduleId: FLEX_STACKER_ID,
    })
  })
})
