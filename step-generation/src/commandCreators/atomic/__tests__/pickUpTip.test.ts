import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { A1_NOZZLE, ALL } from '@opentrons/shared-data'

import { pickUpTip } from '..'
import { MANUAL } from '../../../constants'
import {
  DEFAULT_PIPETTE,
  getErrorResult,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
  TIPRACK_1,
} from '../../../fixtures'

import type { InvariantContext, RobotState } from '../../../types'

describe('pickUpTip', () => {
  let robotStateWithTip: RobotState
  let invariantContext: InvariantContext
  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('pick up tip', () => {
    const params = {
      pipetteId: DEFAULT_PIPETTE,
      labwareId: TIPRACK_1,
      wellName: 'B1',
      primaryNozzle: A1_NOZZLE,
      nozzles: ALL,
    }
    const result = pickUpTip(params, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'pickUpTip',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          labwareId: TIPRACK_1,
          wellName: 'B1',
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `mock_pipette.pick_up_tip(location=mock_tip_rack_1)`
    )
  })
  it('resolves pipetteId, labwareId, and wellName when they are runtime parameters', () => {
    invariantContext.runtimeParameters = {
      selected_pipette: {
        variableName: 'selected_pipette',
        displayName: 'Selected pipette',
        type: 'string',
        default: DEFAULT_PIPETTE,
      },
      selected_tiprack: {
        variableName: 'selected_tiprack',
        displayName: 'Selected tiprack',
        type: 'string',
        default: TIPRACK_1,
      },
      selected_well: {
        variableName: 'selected_well',
        displayName: 'Selected well',
        type: 'string',
        default: 'B1',
      },
      primary_nozzle: {
        variableName: 'primary_nozzle',
        displayName: 'Primary nozzle',
        type: 'string',
        default: A1_NOZZLE,
      },
      nozzle_style: {
        variableName: 'nozzle_style',
        displayName: 'Nozzle style',
        type: 'string',
        default: ALL,
      },
      tip_tracking: {
        variableName: 'tip_tracking',
        displayName: 'Tip tracking',
        type: 'string',
        default: MANUAL,
      },
    }
    const result = pickUpTip(
      {
        pipetteId: 'selected_pipette',
        labwareId: 'selected_tiprack',
        wellName: 'selected_well',
        primaryNozzle: 'primary_nozzle',
        nozzles: 'nozzle_style',
        tipTrackingOption: 'tip_tracking',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'pickUpTip',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            labwareId: TIPRACK_1,
            wellName: 'B1',
          },
        },
      ],
      python:
        'mock_pipette.pick_up_tip(location=mock_tip_rack_1[selected_well])',
    })
  })
  it('returns errors if pipetteId, labwareId, and wellName are not string runtime parameters', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
      mock_int_rtp: {
        variableName: 'mock_int_rtp',
        displayName: 'mock int rtp',
        type: 'int',
        default: 1,
      },
    }
    const result = pickUpTip(
      {
        pipetteId: 'mock_rtp',
        labwareId: 'mock_int_rtp',
        wellName: 'mock_rtp',
        primaryNozzle: 'mock_rtp',
        nozzles: 'mock_int_rtp',
        tipTrackingOption: 'mock_rtp',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_int_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_int_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
