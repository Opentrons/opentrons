import { beforeEach, describe, expect, it } from 'vitest'

import { prepareToAspirate } from '../commandCreators/atomic'
import {
  DEFAULT_PIPETTE,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../fixtures'

import type { PrepareToAspirateParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../types'

describe('prepareToAspirate', () => {
  let invariantContext: InvariantContext
  let robotStateWithTip: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  it('aspirate in place', () => {
    const params: PrepareToAspirateParams = {
      pipetteId: DEFAULT_PIPETTE,
    }
    const result = prepareToAspirate(
      params,
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'prepareToAspirate',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
        },
      },
    ])
    expect(res.python).toBe('mock_pipette.prepare_to_aspirate()')
  })
})
