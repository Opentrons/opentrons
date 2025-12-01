import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
} from '@opentrons/shared-data'

import { flexStackerStore } from '../commandCreators/atomic/flexStackerStore'
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
  it('creates flex stacker store command', () => {
    const result = flexStackerStore(
      {
        moduleId,
        strategy: 'automatic',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'flexStacker/store',
          key: expect.any(String),
          params: {
            moduleId,
            strategy: 'automatic',
          },
        },
      ],
      python: 'mock_flex_stacker_1.store()',
    })
  })
})
