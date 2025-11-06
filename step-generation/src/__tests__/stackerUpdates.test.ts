import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import { getInitialRobotStateStandard, makeContext } from '../fixtures'
import {
  forFlexStackerEmpty,
  forFlexStackerFill,
} from '../getNextRobotStateAndWarnings/stackerUpdates'
import { getModuleState } from '../robotStateSelectors'
import { FlexStackerModuleState } from '../types'
import { uuid } from '../utils'

vi.mock('../robotStateSelectors')
describe('flex stacker state updates forFlexStackerEmpty', () => {
  const FLEX_STACKER_ID = 'flexStackerId'
  const invariantContext = makeContext()
  const robotState = getInitialRobotStateStandard(invariantContext)
  console.log('robotState: ', robotState)
  beforeEach(() => {
    vi.mocked(getModuleState).mockReturnValue({
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInStacker: ['labware1', 'labware2', 'labware3'],
      max_pool_count: 6,
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
    console.log('moduleState: ', moduleState)
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
    console.log('moduleState: ', moduleState)
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
    console.log('moduleState: ', moduleState)
    expect(moduleState?.labwareInStacker).toBeNull()
  })
})

describe('flex stacker state updates forFlexStackerFill', () => {
  const FLEX_STACKER_ID = 'flexStackerId'
  const invariantContext = makeContext()
  const robotState = getInitialRobotStateStandard(invariantContext)
  beforeEach(() => {
    vi.mocked(getModuleState).mockReturnValue({
      type: FLEX_STACKER_MODULE_TYPE,
      labwareInStacker: ['labware1', 'labware2', 'labware3'],
      max_pool_count: 6,
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
    console.log('moduleState: ', moduleState)
    expect(moduleState?.labwareInStacker).toHaveLength(3)
  })

  it('should not add labware to the list if count is greater than max_pool_count', () => {
    const props = {
      count: 7,
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
