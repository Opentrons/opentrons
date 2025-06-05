import { beforeEach, describe, expect, it } from 'vitest'

import { dispenseInPlace } from '../commandCreators/atomic'
import {
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../fixtures'

import type { DispenseInPlaceParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../types'

describe('dispenseInPlace', () => {
  let invariantContext: InvariantContext
  let robotStateWithTip: RobotState

  const mockId = 'p300SingleId'
  const mockFlowRate = 10
  const mockVolume = 10
  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  it('dispense in place', () => {
    const params: DispenseInPlaceParams = {
      pipetteId: mockId,
      flowRate: mockFlowRate,
      volume: mockVolume,
    }
    const result = dispenseInPlace(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'dispenseInPlace',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          volume: mockVolume,
          flowRate: mockFlowRate,
        },
      },
    ])
    expect(res.python).toBe(`mock_pipette.dispense(volume=10, flow_rate=10)`)
  })
})
