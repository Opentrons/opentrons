import { describe, expect, it } from 'vitest'

import {
  ALL,
  COLUMN,
  fixtureP100096V2Specs,
  PARTIAL_COLUMN,
} from '@opentrons/shared-data'

import { getErrorResult, getSuccessResult } from '../../../fixtures'
import { configureNozzleLayout } from '../configureNozzleLayout'

const getRobotInitialState = (): any => {
  return {}
}

const mockPipette = 'mockPipette'
const mockTiprack = 'mockTiprack'
const invariantContext: any = {
  pipetteEntities: {
    [mockPipette]: {
      name: 'p1000_96',
      id: mockPipette,
      pythonName: 'mock_pipette',
      spec: fixtureP100096V2Specs,
    },
  },
  labwareEntities: {
    [mockTiprack]: {
      pythonName: 'mock_tiprack',
    },
  },
  runtimeParameters: {},
}
const robotInitialState = getRobotInitialState()

describe('configureNozzleLayout', () => {
  it('should call configureNozzleLayout with correct params for full tip', () => {
    const result = configureNozzleLayout(
      {
        configurationParams: {
          primaryNozzle: undefined,
          style: ALL,
        },
        pipetteId: mockPipette,
      },
      invariantContext,
      robotInitialState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'configureNozzleLayout',
        key: expect.any(String),
        params: {
          pipetteId: mockPipette,
          configurationParams: { style: ALL },
        },
      },
    ])
    expect(res.python).toBe(
      `
mock_pipette.configure_nozzle_layout(
    protocol_api.ALL,
)`.trimStart()
    )
  })
  it('should call configureNozzleLayout with correct params for column tip', () => {
    const result = configureNozzleLayout(
      {
        configurationParams: {
          primaryNozzle: 'A12',
          style: COLUMN,
        },
        pipetteId: mockPipette,
      },
      invariantContext,
      robotInitialState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'configureNozzleLayout',
        key: expect.any(String),
        params: {
          pipetteId: mockPipette,
          configurationParams: { primaryNozzle: 'A12', style: COLUMN },
        },
      },
    ])
    expect(res.python).toBe(
      `
mock_pipette.configure_nozzle_layout(
    protocol_api.COLUMN,
    start="A12",
)`.trimStart()
    )
  })
  it('should call configureNozzleLayout with correct params for partial column', () => {
    const result = configureNozzleLayout(
      {
        configurationParams: {
          primaryNozzle: 'D1',
          style: PARTIAL_COLUMN,
        },
        pipetteId: mockPipette,
      },
      invariantContext,
      robotInitialState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'configureNozzleLayout',
        key: expect.any(String),
        params: {
          pipetteId: mockPipette,
          configurationParams: { primaryNozzle: 'D1', style: PARTIAL_COLUMN },
        },
      },
    ])
    expect(res.python).toBe(
      `
mock_pipette.configure_nozzle_layout(
    protocol_api.PARTIAL_COLUMN,
    start="H1", end="D1",
)`.trimStart()
    )
  })
  it('resolves all args when they are runtime parameters', () => {
    invariantContext.runtimeParameters = {
      selected_pipette: {
        variableName: 'selected_pipette',
        displayName: 'Selected pipette',
        type: 'string',
        default: mockPipette,
      },
      nozzle_style: {
        variableName: 'nozzle_style',
        displayName: 'Nozzle style',
        type: 'string',
        default: PARTIAL_COLUMN,
      },
      end_nozzle: {
        variableName: 'end_nozzle',
        displayName: 'End nozzle',
        type: 'string',
        default: 'D1',
      },
      back_left_nozzle: {
        variableName: 'back_left_nozzle',
        displayName: 'Back left nozzle',
        type: 'string',
        default: 'B1',
      },
    }
    const result = configureNozzleLayout(
      {
        configurationParams: {
          primaryNozzle: 'end_nozzle',
          style: 'nozzle_style',
          backLeftNozzle: 'back_left_nozzle',
        },
        pipetteId: 'selected_pipette',
      },
      invariantContext,
      robotInitialState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'configureNozzleLayout',
          key: expect.any(String),
          params: {
            pipetteId: mockPipette,
            configurationParams: {
              primaryNozzle: 'D1',
              style: PARTIAL_COLUMN,
              backLeftNozzle: 'B1',
            },
          },
        },
      ],
      python: `
mock_pipette.configure_nozzle_layout(
    nozzle_style,
    start="H1", end=end_nozzle,
    back_left=back_left_nozzle,
)`.trimStart(),
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
    }
    const result = configureNozzleLayout(
      {
        configurationParams: {
          primaryNozzle: 'missing_nozzle',
          style: 'missing_style',
          backLeftNozzle: 'mock_rtp',
        },
        pipetteId: 'mock_rtp',
      },
      invariantContext,
      robotInitialState
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "missing_style" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "missing_nozzle" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
