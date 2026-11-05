import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_PIPETTE,
  getErrorResult,
  getInitialRobotStateStandard,
  getSuccessResult,
  makeContext,
  SOURCE_LABWARE,
} from '../../../fixtures'
import { aspirateWhileTracking } from '../aspirateWhileTracking'

import type { AspDispWhileTrackingParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

const trackingParams: AspDispWhileTrackingParams = {
  pipetteId: DEFAULT_PIPETTE,
  labwareId: SOURCE_LABWARE,
  wellName: 'A1',
  volume: 50,
  flowRate: 6,
  trackFromLocation: {
    origin: 'bottom',
    offset: { z: 5 },
  },
  trackToLocation: {
    origin: 'top',
    offset: { z: 10 },
  },
}

describe('aspirateWhileTracking', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    robotState = getInitialRobotStateStandard(invariantContext)
  })

  it('generates JSON and python', () => {
    const result = aspirateWhileTracking(
      trackingParams,
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'aspirateWhileTracking',
        key: expect.any(String),
        params: trackingParams,
      },
    ])

    expect(getSuccessResult(result).python).toBe(
      `
mock_pipette.aspirate(
    volume=50,
    location=mock_source_plate["A1"].bottom(z=5),
    flow_rate=6,
    end_location=mock_source_plate["A1"].top(z=10),
)`.trimStart()
    )
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
      volume: {
        variableName: 'volume',
        displayName: 'Volume',
        type: 'int',
        default: 50,
      },
      flow_rate: {
        variableName: 'flow_rate',
        displayName: 'Flow rate',
        type: 'int',
        default: 6,
      },
      from_origin: {
        variableName: 'from_origin',
        displayName: 'From origin',
        type: 'string',
        default: 'bottom',
      },
      from_z: {
        variableName: 'from_z',
        displayName: 'From z',
        type: 'int',
        default: 5,
      },
      to_origin: {
        variableName: 'to_origin',
        displayName: 'To origin',
        type: 'string',
        default: 'top',
      },
      to_z: {
        variableName: 'to_z',
        displayName: 'To z',
        type: 'int',
        default: 10,
      },
    }
    const result = aspirateWhileTracking(
      {
        pipetteId: 'selected_pipette',
        labwareId: 'selected_labware',
        wellName: 'selected_well',
        volume: 'volume',
        flowRate: 'flow_rate',
        trackFromLocation: {
          origin: 'from_origin',
          offset: { z: 'from_z' },
        },
        trackToLocation: {
          origin: 'to_origin',
          offset: { z: 'to_z' },
        },
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'aspirateWhileTracking',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            labwareId: SOURCE_LABWARE,
            wellName: 'A1',
            volume: 50,
            flowRate: 6,
            trackFromLocation: {
              origin: 'bottom',
              offset: { z: 5 },
            },
            trackToLocation: {
              origin: 'top',
              offset: { z: 10 },
            },
          },
        },
      ],
      python: `
mock_pipette.aspirate(
    volume=volume,
    location=mock_source_plate[selected_well].bottom(z=from_z),
    flow_rate=flow_rate,
    end_location=mock_source_plate[selected_well].top(z=to_z),
)`.trimStart(),
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
    const result = aspirateWhileTracking(
      {
        pipetteId: 'mock_rtp',
        labwareId: 'mock_rtp',
        wellName: 'mock_rtp',
        volume: 'mock_string_rtp',
        flowRate: 'mock_string_rtp',
        trackFromLocation: {
          origin: 'mock_rtp',
          offset: { z: 'mock_string_rtp' },
        },
        trackToLocation: {
          origin: 'mock_rtp',
          offset: { z: 'mock_string_rtp' },
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
        message: 'Runtime parameter "mock_string_rtp" is missing',
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
