import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import { getInitialRobotStateStandard, makeContext } from '../fixtures'
import {
  forFlexStackerEmpty,
  forFlexStackerFill,
} from '../getNextRobotStateAndWarnings/stackerUpdates'
import { getModuleState } from '../robotStateSelectors'
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
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should remove the last item from the stored stacker list', () => {
    const props = {
      count: 1,
      moduleId: FLEX_STACKER_ID,
      strategy: 'logical',
    }
    forFlexStackerEmpty(props, invariantContext, robotState)

    const moduleState = getModuleState(robotState, FLEX_STACKER_ID)
    console.log('moduleState: ', moduleState)
    expect(moduleState?.labwareInStacker).toEqual(['labware2', 'labware3'])
  })

  it('should remove all items from the stored stacker list if count is null', () => {
    const props = {
      count: null,
      moduleId: FLEX_STACKER_ID,
      strategy: 'logical',
    }
    forFlexStackerEmpty(props, invariantContext, robotState)

    const moduleState = getModuleState(robotState, FLEX_STACKER_ID)
    expect(moduleState?.labwareInStacker).toEqual(null)
  })

  it('should remove all items from the stored stacker list if count is null', () => {
    const props = {
      count: null,
      moduleId: FLEX_STACKER_ID,
      strategy: 'logical',
    }
    forFlexStackerEmpty(props, invariantContext, robotState)

    const moduleState = getModuleState(robotState, FLEX_STACKER_ID)
    console.log('moduleState: ', moduleState)
    expect(moduleState?.labwareInStacker).toEqual(null)
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
    } as any)
  })

  it('should add the specified number of items to the stored stacker list', () => {
    const props = {
      count: 1,
      moduleId: FLEX_STACKER_ID,
      strategy: 'logical',
    }
    forFlexStackerFill(props, invariantContext, robotState)

    const moduleState = getModuleState(robotState, FLEX_STACKER_ID)
    console.log('moduleState: ', moduleState)
    expect(moduleState?.labwareInStacker).toHaveLength(4)
  })

  it('should not add labware to the list if count is null', () => {
    const props = {
      count: null,
      moduleId: FLEX_STACKER_ID,
      strategy: 'logical',
    }
    forFlexStackerFill(props, invariantContext, robotState)

    const moduleState = getModuleState(robotState, FLEX_STACKER_ID)
    console.log('moduleState: ', moduleState)
    expect(moduleState?.labwareInStacker).toHaveLength(3)
  })
})
