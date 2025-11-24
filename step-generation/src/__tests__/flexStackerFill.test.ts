import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
} from '@opentrons/shared-data'

import { flexStackerFill } from '../commandCreators/atomic/flexStackerFill'
import { getInitialRobotStateStandard, makeContext } from '../fixtures'

import type { InvariantContext, RobotState } from '../types'

const moduleId = 'flexStackerId'
vi.mock('../robotStateSelectors')

describe('flexStackerStore', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState
  beforeEach(() => {
    invariantContext = makeContext()
    robotState = getInitialRobotStateStandard(invariantContext)
    invariantContext.moduleEntities[moduleId] = {
      id: moduleId,
      type: FLEX_STACKER_MODULE_TYPE,
      model: FLEX_STACKER_MODULE_V1,
      pythonName: 'mock_flex_stacker_1',
    }
  })
  it('creates flex stacker fill command with count', () => {
    const result = flexStackerFill(
      {
        moduleId,
        count: 10,
        strategy: 'manualWithPause',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'flexStacker/fill',
          key: expect.any(String),
          params: {
            moduleId,
            strategy: 'manualWithPause',
            count: 10,
          },
        },
      ],
      python: 'mock_flex_stacker_1.fill(count=10)',
    })
  })
  it('creates flex stacker fill command with message', () => {
    const result = flexStackerFill(
      {
        moduleId,
        message: 'Filling...',
        strategy: 'manualWithPause',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'flexStacker/fill',
          key: expect.any(String),
          params: {
            moduleId,
            strategy: 'manualWithPause',
            message: 'Filling...',
          },
        },
      ],
      python: 'mock_flex_stacker_1.fill(message="Filling...")',
    })
  })
})
