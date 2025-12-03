import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
} from '@opentrons/shared-data'

import { flexStackerFillItems } from '../commandCreators/atomic/flexStackerFillItems'
import { getInitialRobotStateStandard, makeContext } from '../fixtures'

import type { InvariantContext, RobotState } from '../types'

const moduleId = 'flexStackerId'
vi.mock('../robotStateSelectors')

describe('flexStackerFillItems', () => {
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
    const result = flexStackerFillItems(
      {
        moduleId,
       labware: [],
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'flexStacker/fillItems',
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
    const result = flexStackerFillItems(
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
