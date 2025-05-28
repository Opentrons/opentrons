import { describe, expect, it, vi } from 'vitest'

import { blowOutInTrash } from '../commandCreators/compound'
import {
  DEFAULT_PIPETTE,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../fixtures'
import { PROTOCOL_CONTEXT_NAME } from '../utils'

import type { CutoutId } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../types'

vi.mock('../getNextRobotStateAndWarnings/dispenseUpdateLiquidState')

const mockCutout: CutoutId = 'cutoutA3'
const mockTrashId = 'mockTrashId'
let invariantContext: InvariantContext = {
  ...makeContext(),
  trashBinEntities: {
    [mockTrashId]: {
      id: mockTrashId,
      pythonName: 'mock_trash_bin_1',
      location: mockCutout,
    },
  },
}
const prevRobotState: RobotState = getRobotStateWithTipStandard(
  invariantContext
)

describe('blowOutInTrash', () => {
  it('returns correct commands for blowout in a trash bin for a flex', () => {
    const result = blowOutInTrash(
      {
        pipetteId: DEFAULT_PIPETTE,
        flowRate: 10,
        trashId: mockTrashId,
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
          addressableAreaName: 'movableTrashA3',
          offset: { x: 0, y: 0, z: 0 },
        },
      },
      {
        commandType: 'blowOutInPlace',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          flowRate: 10,
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `
mock_pipette.flow_rate.blow_out = 10
mock_pipette.blow_out(mock_trash_bin_1)
`.trim()
    )
  })
  it('returns correct commands for blowout in a trash bin for an ot-2', () => {
    const mockFixedTrashId = 'fixedTrashId'
    invariantContext = {
      ...invariantContext,
      trashBinEntities: {
        [mockFixedTrashId]: {
          id: mockFixedTrashId,
          pythonName: `${PROTOCOL_CONTEXT_NAME}.fixed_trash`,
          location: 'cutout12',
        },
      },
    }
    const result = blowOutInTrash(
      {
        pipetteId: DEFAULT_PIPETTE,
        flowRate: 10,
        trashId: mockFixedTrashId,
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
          addressableAreaName: 'fixedTrash',
          offset: { x: 0, y: 0, z: 0 },
        },
      },
      {
        commandType: 'blowOutInPlace',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          flowRate: 10,
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `
mock_pipette.flow_rate.blow_out = 10
mock_pipette.blow_out(protocol.fixed_trash)
`.trim()
    )
  })
})
