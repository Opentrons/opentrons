import { beforeEach, describe, expect, it } from 'vitest'

import { expectTimelineError } from '../../../__utils__/testMatchers'
import {
  DEFAULT_PIPETTE,
  getErrorResult,
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
  SOURCE_LABWARE,
} from '../../../fixtures'
import { touchTip } from '../touchTip'

import type { InvariantContext, RobotState } from '../../../types'

describe('touchTip', () => {
  let invariantContext: InvariantContext
  let initialRobotState: RobotState
  let robotStateWithTip: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })

  it('touchTip with tip, specifying offsetFromBottomMm, speed, and mmFromEdge', () => {
    const result = touchTip(
      {
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
        zOffsetFromTop: 10,
        speed: 10,
        mmFromEdge: 0.2,
      },
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      {
        commandType: 'touchTip',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          labwareId: SOURCE_LABWARE,
          wellName: 'A1',
          wellLocation: {
            origin: 'top',
            offset: {
              z: 10,
            },
          },
          speed: 10,
          mmFromEdge: 0.2,
        },
      },
    ])
    expect(res.python).toBe(
      `mock_pipette.touch_tip(mock_source_plate["A1"], v_offset=10, speed=10, mm_from_edge=0.2)`
    )
  })

  it('touchTip for python with tip, with no offset or speed set', () => {
    const result = touchTip(
      {
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
        zOffsetFromTop: 10,
      },
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)

    expect(res.python).toBe(
      `mock_pipette.touch_tip(mock_source_plate["A1"], v_offset=10)`
    )
  })

  it('touchTip with invalid pipette ID should throw error', () => {
    const result = touchTip(
      {
        pipetteId: 'badPipette',
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
        zOffsetFromTop: 10,
      },
      invariantContext,
      robotStateWithTip
    )
    const res = getErrorResult(result)

    expectTimelineError(res.errors, 'PIPETTE_DOES_NOT_EXIST')
  })

  it('touchTip with no tip should throw error', () => {
    const result = touchTip(
      {
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
        zOffsetFromTop: 10,
      },
      invariantContext,
      initialRobotState
    )
    const res = getErrorResult(result)

    expect(res.errors).toEqual([
      {
        message:
          "Attempted to touchTip with no tip on pipette: p300SingleId from sourcePlateId's well A1",
        type: 'NO_TIP_ON_PIPETTE',
      },
    ])
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
      z_offset: {
        variableName: 'z_offset',
        displayName: 'Z offset',
        type: 'float',
        default: 10,
      },
      tip_speed: {
        variableName: 'tip_speed',
        displayName: 'Tip speed',
        type: 'int',
        default: 10,
      },
      edge_mm: {
        variableName: 'edge_mm',
        displayName: 'Edge mm',
        type: 'float',
        default: 0.2,
      },
    }
    const result = touchTip(
      {
        pipetteId: 'selected_pipette',
        labwareId: 'selected_labware',
        wellName: 'selected_well',
        zOffsetFromTop: 'z_offset',
        speed: 'tip_speed',
        mmFromEdge: 'edge_mm',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'touchTip',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            labwareId: SOURCE_LABWARE,
            wellName: 'A1',
            wellLocation: {
              origin: 'top',
              offset: {
                z: 10,
              },
            },
            speed: 10,
            mmFromEdge: 0.2,
          },
        },
      ],
      python:
        'mock_pipette.touch_tip(mock_source_plate[selected_well], v_offset=z_offset, speed=tip_speed, mm_from_edge=edge_mm)',
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
    const result = touchTip(
      {
        pipetteId: 'mock_rtp',
        labwareId: 'mock_rtp',
        wellName: 'mock_rtp',
        zOffsetFromTop: 'mock_string_rtp',
        speed: 'mock_rtp',
        mmFromEdge: 'mock_string_rtp',
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
