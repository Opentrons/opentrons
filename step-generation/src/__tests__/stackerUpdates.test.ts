import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import { getInitialRobotStateStandard, makeContext } from '../fixtures'
import {
  forFlexStackerEmpty,
  forFlexStackerFill,
  forFlexStackerRetrieve,
} from '../getNextRobotStateAndWarnings/stackerUpdates'
import { getModuleState } from '../robotStateSelectors'

import type { FlexStackerModuleState } from '../types'

vi.mock('../robotStateSelectors')

const LABWARE_ID = 'sourcePlateId'
const FLEX_STACKER_ID = 'flexStackerId'

describe('flex stacker state updates forFlexStackerEmpty', () => {
  const FLEX_STACKER_ID = 'flexStackerId'
  const invariantContext = makeContext()
  const robotState = getInitialRobotStateStandard(invariantContext)
  beforeEach(() => {
    vi.mocked(getModuleState).mockReturnValue({
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInStacker: ['labware1', 'labware2', 'labware3'],
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
    expect(moduleState?.labwareInStacker).toEqual(['labware2', 'labware3'])
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
    expect(moduleState?.labwareInStacker).toBeNull()
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
    expect(moduleState?.labwareInStacker).toBeNull()
  })
})

describe('flex stacker state updates forFlexStackerFill', () => {
  const invariantContext = makeContext()
  const robotState = getInitialRobotStateStandard(invariantContext)
  beforeEach(() => {
    vi.mocked(getModuleState).mockReturnValue({
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInStacker: ['labware1', 'labware2', 'labware3'],
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
    expect(moduleState?.labwareInStacker).toHaveLength(4)
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
    expect(moduleState?.labwareInStacker).toHaveLength(3)
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
    console.log('moduleState: ', moduleState)
    expect(moduleState?.labwareInStacker).toHaveLength(3)
  })
})

describe('flex stacker state updates forFlexStackerRetrieve', () => {
  const invariantContext = makeContext()
  const robotState = getInitialRobotStateStandard(invariantContext)
  beforeEach(() => {
    vi.mocked(getModuleState).mockReturnValue({
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInStacker: ['tiprack1Id', 'tiprack2Id', 'tiprack4AdapterId'],
      max_pool_count: 6,
      labwareStored: LABWARE_ID,
    } as any)
  })

  it('should raise an error if there is no labware in the stacker', () => {
    vi.mocked(getModuleState).mockReturnValue({
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInStacker: [],
      max_pool_count: 6,
      labwareStored: LABWARE_ID,
    } as any)
    expect(() => {
      forFlexStackerRetrieve({ moduleId: FLEX_STACKER_ID }, invariantContext, {
        robotState,
        warnings: [],
      })
    }).toThrow('Cannot retrieve labware bc there is no labware in the stacker')
  })

  it('should raise an error if there is labware on the shuttle', () => {
    vi.mocked(getModuleState).mockReturnValue({
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInStacker: ['tiprack1Id', 'tiprack2Id', 'tiprack4AdapterId'],
      max_pool_count: 6,
      labwareStored: LABWARE_ID,
      shuttlePosition: 'retrieved',
    } as any)
    expect(() => {
      forFlexStackerRetrieve({ moduleId: FLEX_STACKER_ID }, invariantContext, {
        robotState,
        warnings: [],
      })
    }).toThrow('Cannot retrieve labware bc there is labware on the shuttle')
  })

  it('should raise an error if there is no stored labware details or primary labware', () => {
    expect(() => {
      forFlexStackerRetrieve({ moduleId: FLEX_STACKER_ID }, invariantContext, {
        robotState,
        warnings: [],
      })
    }).toThrow(
      'Cannot retrieve labware bc there is no stored labware details or primary labware'
    )
  })

  it('should retrieve the labware from the stacker', () => {
    vi.mocked(getModuleState).mockReturnValue({
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInStacker: ['tiprack1Id', 'tiprack2Id', 'tiprack4AdapterId'],
      max_pool_count: 6,
      labwareStored: LABWARE_ID,
      shuttlePosition: 'home',
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
    expect(moduleState?.shuttlePosition).toBe('retrieved')
    expect(moduleState?.labwareInStacker).toHaveLength(2)
    expect(robotState.labware['tiprack1Id']?.stack).toHaveLength(1)
  })
})
