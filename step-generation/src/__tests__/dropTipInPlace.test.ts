import { beforeEach, describe, expect, it } from 'vitest'

import { dropTipInPlace } from '../commandCreators/atomic'
import {
  DEFAULT_PIPETTE,
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../fixtures'

import type { DropTipInPlaceParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../types'

const p300SingleId = DEFAULT_PIPETTE

describe('dropTipInPlace', () => {
  let invariantContext: InvariantContext
  let initialRobotState: RobotState
  let robotStateWithTip: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  it('dropTip in place', () => {
    initialRobotState.tipState.pipettes = {
      [p300SingleId]: {
        hasTip: true,
        tiprackURI: 'tiprackId',
      },
    }
    const params: DropTipInPlaceParams = {
      pipetteId: DEFAULT_PIPETTE,
    }
    const result = dropTipInPlace(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'dropTipInPlace',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
        },
      },
    ])
  })
})
