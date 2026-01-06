import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  FLEX_STACKER_MODULE_TYPE,
  getHeightOfLabwareStackFromDefinitions,
  getLabwareOverlapOffset,
  getStackerMaxPoolCountByHeight,
  SYSTEM_LOCATION,
} from '@opentrons/shared-data'

import { HOPPER_STACKER_LOCATION } from '../../constants'
import { getInitialRobotStateStandard, makeContext } from '../../fixtures'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import {
  forFlexStackerEmpty,
  forFlexStackerFill,
  forFlexStackerRetrieve,
  forFlexStackerStore,
} from '../stackerUpdates'

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

describe('flex stacker state updates forFlexStackerFill', () => {
  const invariantContext = makeContext()
  const robotState = getInitialRobotStateStandard(invariantContext)
  beforeEach(() => {
    vi.mocked(getLabwareOverlapOffset).mockReturnValue({ x: 0, y: 0, z: 10 })
    vi.mocked(getHeightOfLabwareStackFromDefinitions).mockReturnValue(10)
    vi.mocked(getStackerMaxPoolCountByHeight).mockReturnValue(10)
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
          {
            primaryLabwareId: 'labware3',
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
  })

  it('should add the specified number of items to the stored stacker list', () => {
    const props = {
      count: 1,
      moduleId: FLEX_STACKER_ID,
      strategy: 'logical' as const,
    }
    forFlexStackerFill(props, invariantContext, {
      robotState: robotState,
      warnings: [],
    })

    const moduleState = flexStackerStateGetter(robotState, FLEX_STACKER_ID)
    expect(moduleState?.labwareInHopper).toHaveLength(4)
  })

  it('should not add labware to the list if count is null', () => {
    const props = {
      moduleId: FLEX_STACKER_ID,
      strategy: 'logical' as const,
    }
    forFlexStackerFill(props, invariantContext, {
      robotState: robotState,
      warnings: [],
    })

    const moduleState = flexStackerStateGetter(robotState, FLEX_STACKER_ID)
    expect(moduleState?.labwareInHopper).toHaveLength(3)
  })

  it('should not add labware to the list if count is greater than maxPoolCount', () => {
    const props = {
      count: 15,
      moduleId: FLEX_STACKER_ID,
      strategy: 'logical' as const,
    }
    forFlexStackerFill(props, invariantContext, { robotState, warnings: [] })
    const moduleState = flexStackerStateGetter(robotState, FLEX_STACKER_ID)
    expect(moduleState?.labwareInHopper).toHaveLength(3)
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
})
