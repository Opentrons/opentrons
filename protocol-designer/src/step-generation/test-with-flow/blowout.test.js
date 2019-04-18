// @flow
import { expectTimelineError } from './testMatchers'
import _blowout from '../commandCreators/atomic/blowout'
import {
  makeContext,
  makeState,
  commandCreatorNoErrors,
  commandCreatorHasErrors,
} from './fixtures'

import updateLiquidState from '../dispenseUpdateLiquidState'

const blowout = commandCreatorNoErrors(_blowout)
const blowoutWithErrors = commandCreatorHasErrors(_blowout)

jest.mock('../dispenseUpdateLiquidState')

describe('blowout', () => {
  let invariantContext
  let initialRobotState
  let robotStateWithTip

  beforeEach(() => {
    // TODO IMMEDIATELY this invariantContext/initialRobotState/robotStateWithTip is repeated in aspirate.test.js -- make a fixture helper?
    invariantContext = makeContext()
    const makeStateArgs = {
      invariantContext,
      pipetteLocations: { p300SingleId: { mount: 'left' } },
      labwareLocations: {
        tiprack1Id: { slot: '1' },
        sourcePlateId: { slot: '2' },
      },
    }
    initialRobotState = makeState({
      ...makeStateArgs,
      tiprackSetting: { tiprack1Id: true },
    })
    robotStateWithTip = makeState({
      ...makeStateArgs,
      tiprackSetting: { tiprack1Id: false },
    })
    robotStateWithTip.tipState.pipettes.p300SingleId = true

    // $FlowFixMe: mock methods
    updateLiquidState.mockClear()
    // $FlowFixMe: mock methods
    updateLiquidState.mockReturnValue(initialRobotState.liquidState)
  })

  test('blowout with tip', () => {
    const result = blowout({
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1',
    })(invariantContext, robotStateWithTip)

    expect(result.commands).toEqual([
      {
        command: 'blowout',
        params: {
          pipette: 'p300SingleId',
          labware: 'sourcePlateId',
          well: 'A1',
        },
      },
    ])

    expect(result.robotState).toEqual(robotStateWithTip)
  })

  test('blowout with invalid pipette ID should throw error', () => {
    const result = blowoutWithErrors({
      pipette: 'badPipette',
      labware: 'sourcePlateId',
      well: 'A1',
    })(invariantContext, robotStateWithTip)

    expectTimelineError(result.errors, 'PIPETTE_DOES_NOT_EXIST')
  })

  test('blowout with invalid labware ID should throw error', () => {
    const result = blowoutWithErrors({
      pipette: 'p300SingleId',
      labware: 'badLabware',
      well: 'A1',
    })(invariantContext, robotStateWithTip)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })

  test('blowout with no tip should throw error', () => {
    const result = blowoutWithErrors({
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1',
    })(invariantContext, initialRobotState)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'NO_TIP_ON_PIPETTE',
    })
  })

  describe('liquid tracking', () => {
    const mockLiquidReturnValue = 'expected liquid state'
    beforeEach(() => {
      // $FlowFixMe
      updateLiquidState.mockReturnValue(mockLiquidReturnValue)
    })

    test('blowout calls dispenseUpdateLiquidState with max volume of pipette', () => {
      const result = blowout({
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A1',
      })(invariantContext, robotStateWithTip)

      expect(updateLiquidState).toHaveBeenCalledWith(
        {
          invariantContext,
          pipetteId: 'p300SingleId',
          labwareId: 'sourcePlateId',
          useFullVolume: true,
          well: 'A1',
        },
        robotStateWithTip.liquidState
      )

      expect(result.robotState.liquidState).toBe(mockLiquidReturnValue)
    })
  })
})
