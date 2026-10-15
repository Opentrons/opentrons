import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectTimelineError } from '../../../__utils__/testMatchers'
import {
  DEFAULT_PIPETTE,
  getErrorResult,
  getInitialRobotStateStandard,
  getInitialRobotStateWithOffDeckLabwareStandard,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
  SOURCE_LABWARE,
} from '../../../fixtures'
import { blowOutInWell } from '../blowOutInWell'

import type { BlowoutParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

vi.mock('../../../utils/heaterShakerCollision')

describe('blowOutInWell', () => {
  let invariantContext: InvariantContext
  let initialRobotState: RobotState
  let robotStateWithTip: RobotState
  let params: BlowoutParams
  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
    params = {
      pipetteId: DEFAULT_PIPETTE,
      labwareId: SOURCE_LABWARE,
      wellName: 'A1',
      flowRate: 21.1,
      wellLocation: {
        origin: 'top',
        offset: {
          z: -1.3,
        },
      },
    }
  })
  it('blowout with tip', () => {
    const result = blowOutInWell(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'blowout',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          labwareId: SOURCE_LABWARE,
          wellName: 'A1',
          flowRate: 21.1,
          wellLocation: {
            origin: 'top',
            offset: {
              z: -1.3,
            },
          },
        },
      },
    ])
    expect(res.python).toBe(
      `
mock_pipette.flow_rate.blow_out = 21.1
mock_pipette.blow_out(mock_source_plate["A1"].top(z=-1.3))
`.trim()
    )
  })
  it('blowout with invalid pipette ID should throw error', () => {
    const result = blowOutInWell(
      { ...params, pipetteId: 'badPipette' },
      invariantContext,
      robotStateWithTip
    )
    expectTimelineError(getErrorResult(result).errors, 'PIPETTE_DOES_NOT_EXIST')
  })
  it('blowout with invalid labware ID should throw error', () => {
    const result = blowOutInWell(
      { ...params, labwareId: 'badLabware' },
      invariantContext,
      robotStateWithTip
    )
    const res = getErrorResult(result)
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })
  it('blowout with no tip should throw error', () => {
    const result = blowOutInWell(params, invariantContext, initialRobotState)
    const res = getErrorResult(result)
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
      type: 'NO_TIP_ON_PIPETTE',
    })
  })
  it('should return an error when blowing out from labware off deck', () => {
    initialRobotState =
      getInitialRobotStateWithOffDeckLabwareStandard(invariantContext)
    const result = blowOutInWell(
      {
        flowRate: 10,
        wellLocation: {
          offset: {
            z: -3,
          },
        },
        pipetteId: DEFAULT_PIPETTE,
        volume: 50,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
      } as BlowoutParams,
      invariantContext,
      initialRobotState
    )
    expect(getErrorResult(result).errors).toHaveLength(2)
    expect(getErrorResult(result).errors[1]).toMatchObject({
      type: 'LABWARE_OFF_DECK',
    })
  })
  it('resolves runtime parameters into the command and python', () => {
    invariantContext.runtimeParameters = {
      selected_pipette: {
        variableName: 'selected_pipette',
        displayName: 'Selected pipette',
        type: 'string',
        default: DEFAULT_PIPETTE,
      },
      selected_labware: {
        variableName: 'selected_labware',
        displayName: 'Selected labware',
        type: 'string',
        default: SOURCE_LABWARE,
      },
      selected_well: {
        variableName: 'selected_well',
        displayName: 'Selected well',
        type: 'string',
        default: 'A1',
      },
      flow_rate: {
        variableName: 'flow_rate',
        displayName: 'Flow rate',
        type: 'float',
        default: 21.1,
      },
      well_origin: {
        variableName: 'well_origin',
        displayName: 'Well origin',
        type: 'string',
        default: 'top',
      },
      z_offset: {
        variableName: 'z_offset',
        displayName: 'Z offset',
        type: 'float',
        default: -1.3,
      },
    }
    const result = blowOutInWell(
      {
        pipetteId: 'selected_pipette',
        labwareId: 'selected_labware',
        wellName: 'selected_well',
        flowRate: 'flow_rate',
        wellLocation: {
          origin: 'well_origin',
          offset: { z: 'z_offset' },
        },
      },
      invariantContext,
      robotStateWithTip
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'blowout',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            labwareId: SOURCE_LABWARE,
            wellName: 'A1',
            flowRate: 21.1,
            wellLocation: {
              origin: 'top',
              offset: {
                z: -1.3,
              },
            },
          },
        },
      ],
      python: `
mock_pipette.flow_rate.blow_out = flow_rate
mock_pipette.blow_out(mock_source_plate[selected_well].top(z=z_offset))
`.trim(),
    })
  })
  it('returns errors if runtime parameters are not valid', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
      mock_string_rtp: {
        variableName: 'mock_string_rtp',
        displayName: 'mock string rtp',
        type: 'string',
        default: 'mock',
      },
    }
    const result = blowOutInWell(
      {
        pipetteId: 'mock_rtp',
        labwareId: 'mock_rtp',
        wellName: 'mock_rtp',
        flowRate: 'mock_string_rtp',
        wellLocation: {
          origin: 'mock_rtp',
          offset: { z: 'mock_string_rtp' },
        },
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
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
