import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_PIPETTE,
  getErrorResult,
  getInitialRobotStateStandard,
  getSuccessResult,
  makeContext,
  SOURCE_LABWARE,
} from '../../../fixtures'
import { tryLiquidProbe } from '../tryLiquidProbe'

import type { InvariantContext, RobotState } from '../../../types'

describe('tryLiquidProbe', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    robotState = getInitialRobotStateStandard(invariantContext)
  })

  it('generates JSON and python', () => {
    const params = {
      pipetteId: DEFAULT_PIPETTE,
      labwareId: SOURCE_LABWARE,
      wellName: 'A1',
      wellLocation: {
        origin: 'top' as const,
        offset: { z: 2 },
      },
    }
    const result = tryLiquidProbe(params, invariantContext, robotState)
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'tryLiquidProbe',
          key: expect.any(String),
          params,
        },
      ],
      python: 'mock_pipette.detect_liquid_presence(mock_source_plate["A1"])',
    })
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
        default: 'A1',
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
        default: 2,
      },
    }
    const result = tryLiquidProbe(
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
      robotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'tryLiquidProbe',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            labwareId: SOURCE_LABWARE,
            wellName: 'A1',
            wellLocation: {
              origin: 'top',
              offset: { x: 1, y: 2, z: 2 },
            },
          },
        },
      ],
      python:
        'mock_pipette.detect_liquid_presence(mock_source_plate[selected_well])',
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
    const result = tryLiquidProbe(
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
      robotState
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
