import type { LiquidProbeParams } from '@opentrons/shared-data'
import { beforeEach, describe, expect, it } from 'vitest'
import { liquidProbe } from '../commandCreators/atomic'
import {
  DEFAULT_PIPETTE,
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../fixtures'
import type { InvariantContext, RobotState } from '../types'

const p300SingleId = DEFAULT_PIPETTE

describe('liquidProbe', () => {
  let invariantContext: InvariantContext
  let initialRobotState: RobotState
  let robotStateWithTip: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  it('creates liquidProbe command if pipette has tips', () => {
    initialRobotState.tipState.pipettes = {
      [p300SingleId]: true,
    }
    const params: LiquidProbeParams = {
      pipetteId: DEFAULT_PIPETTE,
      labwareId: 'mockLabwareId',
      wellName: 'mockWellName',
      wellLocation: {
        origin: 'top',
        offset: { z: 10 },
      },
    }
    const result = liquidProbe(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'liquidProbe',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          labwareId: 'mockLabwareId',
          wellName: 'mockWellName',
          wellLocation: {
            origin: 'top',
            offset: { z: 10 },
          },
        },
      },
    ])
  })
  it('does not create liquidProbe command if pipette does not have tips', () => {
    robotStateWithTip.tipState.pipettes = {
      [p300SingleId]: false,
    }
    const params: LiquidProbeParams = {
      pipetteId: DEFAULT_PIPETTE,
      labwareId: 'mockLabwareId',
      wellName: 'mockWellName',
      wellLocation: {
        origin: 'top',
        offset: { z: 10 },
      },
    }
    const result = liquidProbe(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([])
  })
})
