import { getSuccessResult } from '../fixtures'
import { ALL } from '@opentrons/shared-data'
import { configureNozzleLayout } from '../commandCreators/atomic/configureNozzleLayout'

const getRobotInitialState = (): any => {
  return {}
}

const invariantContext: any = {}

describe('configureNozzleLayout', () => {
  it('should call configureNozzleLayout with correct params', () => {
    const robotInitialState = getRobotInitialState()
    const mockPipette = 'mockPipette'
    const result = configureNozzleLayout(
      { nozzles: ALL, pipetteId: mockPipette },
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
          configuration_params: { primary_nozzle: 'A1', style: ALL },
        },
      },
    ])
  })
})
