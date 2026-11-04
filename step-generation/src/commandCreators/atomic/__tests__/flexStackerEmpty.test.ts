import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
} from '@opentrons/shared-data'

import {
  getErrorResult,
  getInitialRobotStateStandard,
  makeContext,
} from '../../../fixtures'
import { flexStackerStateGetter } from '../../../robotStateSelectors'
import { flexStackerEmpty } from '../flexStackerEmpty'

import type {
  FlexStackerModuleState,
  InvariantContext,
  RobotState,
} from '../../../types'

const moduleId = 'flexStackerId'
vi.mock('../../../robotStateSelectors')

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

    robotState = getInitialRobotStateStandard(invariantContext)
    robotState.modules[moduleId] = {
      slot: 'D3',
      moduleState: {
        type: FLEX_STACKER_MODULE_TYPE,
        storedLabwareDetails: null,
        labwareOnShuttle: null,
        labwareInHopper: null,
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
        message: 'Take everything out of the Stacker',
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
            message: 'Take everything out of the Stacker',
            count: undefined,
          },
        },
      ],
      python:
        'mock_flex_stacker_1.empty(message="Take everything out of the Stacker")',
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
  it('resolves runtime parameters into the command and python', () => {
    invariantContext.runtimeParameters = {
      selected_module: {
        variableName: 'selected_module',
        displayName: 'Selected module',
        type: 'string',
        default: moduleId,
      },
      strategy: {
        variableName: 'strategy',
        displayName: 'Strategy',
        type: 'string',
        default: 'logical',
      },
      message: {
        variableName: 'message',
        displayName: 'Message',
        type: 'string',
        default: 'Take everything out of the Stacker',
      },
      count: {
        variableName: 'count',
        displayName: 'Count',
        type: 'int',
        default: 2,
      },
    }
    const result = flexStackerEmpty(
      {
        moduleId: 'selected_module',
        strategy: 'strategy',
        message: 'message',
        count: 'count',
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
            message: 'Take everything out of the Stacker',
            count: 2,
          },
        },
      ],
      python: 'mock_flex_stacker_1.empty(message=message)',
    })
  })
  it('returns errors if runtime parameters are not valid', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
      mock_string_rtp: {
        variableName: 'mock_string_rtp',
        displayName: 'mock string rtp',
        type: 'string',
        default: 'mock',
      },
    }
    const result = flexStackerEmpty(
      {
        moduleId: 'mock_rtp',
        strategy: 'mock_rtp',
        message: 'mock_rtp',
        count: 'mock_string_rtp',
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
