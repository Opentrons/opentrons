import { describe, expect, it } from 'vitest'

import { WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'

import { airGapInWasteChute } from '../commandCreators/compound'
import {
  DEFAULT_PIPETTE,
  getInitialRobotStateStandard,
  getSuccessResult,
  makeContext,
} from '../fixtures'

import type { InvariantContext, RobotState } from '../types'

const wasteChuteId = 'wasteChuteId'
const invariantContext: InvariantContext = {
  ...makeContext(),
  wasteChuteEntities: {
    [wasteChuteId]: {
      id: wasteChuteId,
      pythonName: 'mock_waste_chute_1',
      location: WASTE_CHUTE_CUTOUT,
    },
  },
}
const prevRobotState: RobotState = getInitialRobotStateStandard(
  invariantContext
)

describe('airGapInWasteChute', () => {
  it('returns correct commands for air gap in waste chute', () => {
    const result = airGapInWasteChute(
      {
        pipetteId: DEFAULT_PIPETTE,
        volume: 10,
        flowRate: 10,
        wasteChuteId,
      },
      invariantContext,
      prevRobotState
    )
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'moveToAddressableArea',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          addressableAreaName: '1ChannelWasteChute',
          offset: { x: 0, y: 0, z: 0 },
        },
      },
      {
        commandType: 'prepareToAspirate',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
        },
      },
      {
        commandType: 'airGapInPlace',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          flowRate: 10,
          volume: 10,
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `
mock_pipette.move_to(mock_waste_chute_1)
mock_pipette.air_gap(volume=10, in_place=True, flow_rate=10)
`.trim()
    )
  })
})
