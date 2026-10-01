import { beforeEach, describe, expect, it } from 'vitest'

import { dropTipInPlace } from '..'
import { FIXED_TRASH_ID } from '../../../constants'
import {
  DEFAULT_PIPETTE,
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'

import type { DropTipInPlaceParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

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
    const result = dropTipInPlace(params, invariantContext, {
      ...robotStateWithTip,
      pipettes: {
        ...robotStateWithTip.pipettes,
        [DEFAULT_PIPETTE]: {
          ...robotStateWithTip.pipettes[DEFAULT_PIPETTE],
          entityId: FIXED_TRASH_ID,
        },
      },
    })
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
    expect(res.python).toBe(
      'mock_pipette.drop_tip(trash_bin_1, alternate_drop_location=True)'
    )
  })

  it('emits drop_tip() without a fixture when entityId is unset', () => {
    const params: DropTipInPlaceParams = {
      pipetteId: DEFAULT_PIPETTE,
    }
    const result = dropTipInPlace(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.python).toBe('mock_pipette.drop_tip()')
  })

  it('should no-op if there is no tip', () => {
    const params: DropTipInPlaceParams = {
      pipetteId: DEFAULT_PIPETTE,
    }
    const result = dropTipInPlace(params, invariantContext, initialRobotState)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([])
    expect(res.python).toBeUndefined()
  })
})
