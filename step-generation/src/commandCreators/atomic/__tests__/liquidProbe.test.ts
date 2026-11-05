import { beforeEach, describe, expect, it } from 'vitest'

import { liquidProbe } from '..'
import {
  DEFAULT_PIPETTE,
  getErrorResult,
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
  SOURCE_LABWARE,
} from '../../../fixtures'

import type { LiquidProbeParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

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
      [p300SingleId]: {
        hasTip: true,
        tiprackURI: 'tiprackId',
      },
    }
    const params: LiquidProbeParams = {
      pipetteId: DEFAULT_PIPETTE,
      labwareId: SOURCE_LABWARE,
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
          labwareId: SOURCE_LABWARE,
          wellName: 'mockWellName',
          wellLocation: {
            origin: 'top',
            offset: { z: 10 },
          },
        },
      },
    ])
    expect(res.python).toBe(
      'mock_pipette.measure_liquid_height(mock_source_plate["mockWellName"])'
    )
  })
  it('does not create liquidProbe command if pipette does not have tips', () => {
    robotStateWithTip.tipState.pipettes = {
      [p300SingleId]: {
        hasTip: false,
        tiprackURI: null,
      },
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
  it('resolves all args when they are runtime parameters', () => {
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
        default: 'mockWellName',
      },
      well_origin: {
        variableName: 'well_origin',
        displayName: 'Well origin',
        type: 'string',
        default: 'top',
      },
      offset_x: {
        variableName: 'offset_x',
        displayName: 'Offset x',
        type: 'int',
        default: 1,
      },
      offset_y: {
        variableName: 'offset_y',
        displayName: 'Offset y',
        type: 'int',
        default: 2,
      },
      offset_z: {
        variableName: 'offset_z',
        displayName: 'Offset z',
        type: 'int',
        default: 10,
      },
    }
    const result = liquidProbe(
      {
        pipetteId: 'selected_pipette',
        labwareId: 'selected_labware',
        wellName: 'selected_well',
        wellLocation: {
          origin: 'well_origin',
          offset: {
            x: 'offset_x',
            y: 'offset_y',
            z: 'offset_z',
          },
        },
      },
      invariantContext,
      robotStateWithTip
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'liquidProbe',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            labwareId: SOURCE_LABWARE,
            wellName: 'mockWellName',
            wellLocation: {
              origin: 'top',
              offset: { x: 1, y: 2, z: 10 },
            },
          },
        },
      ],
      python:
        'mock_pipette.measure_liquid_height(mock_source_plate[selected_well])',
    })
  })
  it('returns errors if runtime parameters are missing or invalid', () => {
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
    const result = liquidProbe(
      {
        pipetteId: 'mock_rtp',
        labwareId: 'mock_rtp',
        wellName: 'mock_rtp',
        wellLocation: {
          origin: 'mock_rtp',
          offset: {
            x: 'mock_string_rtp',
            y: 'missing_offset',
            z: 'mock_string_rtp',
          },
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
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "missing_offset" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
