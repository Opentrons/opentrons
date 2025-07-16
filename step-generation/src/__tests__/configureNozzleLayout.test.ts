import { describe, expect, it } from 'vitest'

import { ALL, COLUMN, fixtureP100096V2Specs } from '@opentrons/shared-data'

import { configureNozzleLayout } from '../commandCreators/atomic/configureNozzleLayout'
import { getSuccessResult } from '../fixtures'

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
        tiprackId: mockTiprack,
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
    tip_racks=[mock_tiprack],
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
        tiprackId: mockTiprack,
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
    tip_racks=[mock_tiprack],
)`.trimStart()
    )
  })
})
