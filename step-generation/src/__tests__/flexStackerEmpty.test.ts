import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
} from '@opentrons/shared-data'

import { flexStackerEmpty } from '../commandCreators/atomic/flexStackerEmpty'
import {
  getErrorResult,
  getInitialRobotStateStandard,
  makeContext,
} from '../fixtures'
import { flexStackerStateGetter } from '../robotStateSelectors'

import type {
  FlexStackerModuleState,
  InvariantContext,
  RobotState,
} from '../types'

const moduleId = 'flexStackerId'
const gripperId = 'gripperId'
vi.mock('../robotStateSelectors')

describe('flexStackerEmpty', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState
  beforeEach(() => {
    invariantContext = makeContext()
    invariantContext.moduleEntities[moduleId] = {
      id: moduleId,
      type: FLEX_STACKER_MODULE_TYPE,
      model: FLEX_STACKER_MODULE_V1,
      pythonName: 'mock_flex_stacker_1',
    }
    invariantContext.gripperEntities[gripperId] = {
      id: gripperId,
    }

    robotState = getInitialRobotStateStandard(invariantContext)
    robotState.modules[moduleId] = {
      slot: 'D3',
      moduleState: {
        type: FLEX_STACKER_MODULE_TYPE,
        latchOpen: false,
        storedLabwareDetails: null,
        shuttlePosition: 'home',
        labwareInStacker: null,
        labwareInShuttle: null,
        labwareRetrieved: null,
        labwareStored: null,
      },
    }
    vi.mocked(flexStackerStateGetter).mockReturnValue(
      {} as FlexStackerModuleState
    )
  })
  it('creates flex stacker empty command', () => {
    const result = flexStackerEmpty(
      {
        moduleId,
        strategy: 'logical',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'flexStacker/empty',
          key: expect.any(String),
          params: {
            moduleId,
            strategy: 'logical',
            message: undefined,
            count: undefined,
          },
        },
      ],
      python: 'mock_flex_stacker_1.empty()',
    })
  })
  it('creates returns error if bad module state', () => {
    vi.mocked(flexStackerStateGetter).mockReturnValue(null)
    const result = flexStackerEmpty(
      {
        moduleId,
        strategy: 'logical',
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'MISSING_MODULE',
    })
  })
  it('creates returns error if no gripper', () => {
    invariantContext.gripperEntities = {}
    const result = flexStackerEmpty(
      {
        moduleId,
        strategy: 'logical',
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'FLEX_STACKER_NO_GRIPPER',
    })
  })
})
