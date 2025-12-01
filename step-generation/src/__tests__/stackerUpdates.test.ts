import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  FLEX_STACKER_MODULE_TYPE,
  getHeightOfLabwareStackFromDefinitions,
  getLabwareOverlapOffset,
  getStackerMaxPoolCountByHeight,
} from '@opentrons/shared-data'

import { getInitialRobotStateStandard, makeContext } from '../fixtures'
import {
  forFlexStackerEmpty,
  forFlexStackerFill,
  forFlexStackerRetrieve,
  forFlexStackerStore,
} from '../getNextRobotStateAndWarnings/stackerUpdates'
import { getModuleState } from '../robotStateSelectors'

import type { FlexStackerModuleState } from '../types'

vi.mock('../robotStateSelectors')
vi.mock('@opentrons/shared-data', async importOriginal => ({
  ...(await importOriginal()),
  getHeightOfLabwareStackFromDefinitions: vi.fn(),
  getStackerMaxPoolCountByHeight: vi.fn(),
  getLabwareOverlapOffset: vi.fn(),
}))

const LABWARE_ID = 'sourcePlateId'
const FLEX_STACKER_ID = 'flexStackerId'

describe('flex stacker state updates forFlexStackerEmpty', () => {
  const FLEX_STACKER_ID = 'flexStackerId'
  const invariantContext = makeContext()
  const robotState = getInitialRobotStateStandard(invariantContext)
  beforeEach(() => {
    vi.mocked(getModuleState).mockReturnValue({
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInHopper: ['labware1', 'labware2', 'labware3'],
      maxPoolCount: 6,
      labwareStored: LABWARE_ID,
    } as any)
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

    const moduleState = getModuleState(
      robotState,
      FLEX_STACKER_ID
    ) as FlexStackerModuleState
    expect(moduleState?.labwareInHopper).toEqual(['labware2', 'labware3'])
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

    const moduleState = getModuleState(
      robotState,
      FLEX_STACKER_ID
    ) as FlexStackerModuleState
    expect(moduleState?.labwareInHopper).toBeNull()
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

    const moduleState = getModuleState(
      robotState,
      FLEX_STACKER_ID
    ) as FlexStackerModuleState
    expect(moduleState?.labwareInHopper).toBeNull()
  })
})

describe('flex stacker state updates forFlexStackerFill', () => {
  const invariantContext = makeContext()
  const robotState = getInitialRobotStateStandard(invariantContext)
  beforeEach(() => {
    vi.mocked(getLabwareOverlapOffset).mockReturnValue({ x: 0, y: 0, z: 10 })
    vi.mocked(getHeightOfLabwareStackFromDefinitions).mockReturnValue(10)
    vi.mocked(getStackerMaxPoolCountByHeight).mockReturnValue(10)
    vi.mocked(getModuleState).mockReturnValue({
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInHopper: ['labware1', 'labware2', 'labware3'],
      max_pool_count: 6,
      labwareStored: LABWARE_ID,
    } as any)
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

    const moduleState = getModuleState(
      robotState,
      FLEX_STACKER_ID
    ) as FlexStackerModuleState
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

    const moduleState = getModuleState(
      robotState,
      FLEX_STACKER_ID
    ) as FlexStackerModuleState
    expect(moduleState?.labwareInHopper).toHaveLength(3)
  })

  it('should not add labware to the list if count is greater than maxPoolCount', () => {
    const props = {
      count: 15,
      moduleId: FLEX_STACKER_ID,
      strategy: 'logical' as const,
    }
    forFlexStackerFill(props, invariantContext, { robotState, warnings: [] })

    const moduleState = getModuleState(
      robotState,
      FLEX_STACKER_ID
    ) as FlexStackerModuleState
    expect(moduleState?.labwareInHopper).toHaveLength(3)
  })
})

describe('flex stacker state updates forFlexStackerRetrieve', () => {
  const invariantContext = makeContext()
  const robotState = getInitialRobotStateStandard(invariantContext)
  beforeEach(() => {
    vi.mocked(getModuleState).mockReturnValue({
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInHopper: ['tiprack1Id', 'tiprack2Id', 'tiprack4AdapterId'],
      max_pool_count: 6,
      labwareStored: LABWARE_ID,
    } as any)
  })

  it('should raise an error if there is no labware in the stacker', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {}) // Mock to prevent actual console output
    vi.mocked(getModuleState).mockReturnValue({
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInHopper: [],
      max_pool_count: 6,
      labwareStored: LABWARE_ID,
      labwareOnShuttle: null,
    } as any)
    forFlexStackerRetrieve({ moduleId: FLEX_STACKER_ID }, invariantContext, {
      robotState,
      warnings: [],
    })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Cannot retrieve labware bc there is no labware in the stacker'
    )
  })

  it('should raise an error if there is labware on the shuttle', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {}) // Mock to prevent actual console output
    vi.mocked(getModuleState).mockReturnValue({
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInHopper: ['tiprack1Id', 'tiprack2Id', 'tiprack4AdapterId'],
      max_pool_count: 6,
      labwareStored: LABWARE_ID,
      labwareOnShuttle: {
        primaryLabwareId: 'tiprack1Id',
        adapterLabwareId: null,
        lidLabwareId: null,
      },
    } as any)
    forFlexStackerRetrieve({ moduleId: FLEX_STACKER_ID }, invariantContext, {
      robotState,
      warnings: [],
    })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Cannot retrieve labware bc there is labware on the shuttle'
    )
  })

  it('should raise an error if there is no stored labware details or primary labware', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {}) // Mock to prevent actual console output
    vi.mocked(getModuleState).mockReturnValue({
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
          primaryLabwareId: 'tiprack4AdapterId',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
      ],
      max_pool_count: 6,
      labwareStored: LABWARE_ID,
      labwareOnShuttle: null,
    } as any)
    forFlexStackerRetrieve({ moduleId: FLEX_STACKER_ID }, invariantContext, {
      robotState,
      warnings: [],
    })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Cannot retrieve labware bc there is no stored labware details or primary labware'
    )
  })

  it('should retrieve the labware from the stacker', () => {
    vi.mocked(getModuleState).mockReturnValue({
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
          primaryLabwareId: 'tiprack4AdapterId',
          adapterLabwareId: null,
          lidLabwareId: null,
        },
      ],
      max_pool_count: 6,
      labwareStored: LABWARE_ID,
      labwareOnShuttle: null,
      storedLabwareDetails: {
        primaryLabware: LABWARE_ID,
      },
    } as any)

    forFlexStackerRetrieve({ moduleId: FLEX_STACKER_ID }, invariantContext, {
      robotState,
      warnings: [],
    })

    const moduleState = getModuleState(
      robotState,
      FLEX_STACKER_ID
    ) as FlexStackerModuleState
    expect(moduleState?.labwareOnShuttle).not.toBeNull()
    expect(moduleState?.labwareInHopper).toHaveLength(2)
    expect(robotState.labware.tiprack1Id?.stack).toHaveLength(1)
  })
})

describe('flex stacker state updates forFlexStackerStore', () => {
  const invariantContext = makeContext()
  const robotState = getInitialRobotStateStandard(invariantContext)
  robotState.modules[FLEX_STACKER_ID] = {
    slot: '1',
    moduleState: {
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInHopper: ['tiprack1Id', 'tiprack2Id', 'tiprack4AdapterId'],
      max_pool_count: 6,
      labwareStored: LABWARE_ID,
      storedLabwareDetails: {
        primaryLabware: {
          id: LABWARE_ID,
          def: invariantContext.labwareEntities[LABWARE_ID]?.def,
        },
      },
    } as any,
  }
  beforeEach(() => {
    vi.mocked(getModuleState).mockReturnValue({
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInHopper: ['tiprack1Id', 'tiprack2Id', 'tiprack4AdapterId'],
      max_pool_count: 6,
      labwareStored: LABWARE_ID,
      storedLabwareDetails: {
        primaryLabware: {
          id: LABWARE_ID,
          def: invariantContext.labwareEntities[LABWARE_ID]?.def,
        },
      },
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should store the labware in the stacker', () => {
    forFlexStackerStore({ moduleId: FLEX_STACKER_ID }, invariantContext, {
      robotState,
      warnings: [],
    })
    const moduleState = getModuleState(
      robotState,
      FLEX_STACKER_ID
    ) as FlexStackerModuleState
    expect(moduleState?.labwareOnShuttle).toBeNull()
    expect(moduleState?.labwareInHopper).toHaveLength(4)
  })
})
