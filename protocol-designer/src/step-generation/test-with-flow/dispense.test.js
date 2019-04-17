// @flow
import {
  makeContext,
  makeState,
  commandCreatorNoErrors,
  commandCreatorHasErrors,
} from './fixtures'
import _dispense from '../commandCreators/atomic/dispense'

import updateLiquidState from '../dispenseUpdateLiquidState'

jest.mock('../dispenseUpdateLiquidState')
jest.mock('../../labware-defs/utils') // TODO IMMEDIATELY move to somewhere more general

const dispense = commandCreatorNoErrors(_dispense)
const dispenseWithErrors = commandCreatorHasErrors(_dispense)

describe('dispense', () => {
  let initialRobotState
  let robotStateWithTip
  let invariantContext

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

  describe('tip tracking & commands:', () => {
    describe('dispense normally (with tip)', () => {
      const optionalArgsCases = [
        {
          description: 'no optional args',
          expectInParams: false,
          args: {},
        },
        {
          description: 'null optional args',
          expectInParams: false,
          args: {
            offsetFromBottomMm: null,
            'flow-rate': null,
          },
        },
        {
          description: 'all optional args',
          expectInParams: true,
          args: {
            offsetFromBottomMm: 5,
            'flow-rate': 6,
          },
        },
      ]
      optionalArgsCases.forEach(testCase => {
        test(testCase.description, () => {
          const result = dispense({
            pipette: 'p300SingleId',
            volume: 50,
            labware: 'sourcePlateId',
            well: 'A1',
            ...testCase.args,
          })(invariantContext, robotStateWithTip)

          expect(result.commands).toEqual([
            {
              command: 'dispense',
              params: {
                pipette: 'p300SingleId',
                volume: 50,
                labware: 'sourcePlateId',
                well: 'A1',
                ...(testCase.expectInParams ? testCase.args : {}),
              },
            },
          ])
        })
      })
    })

    test('dispense normally (with tip) and optional args', () => {
      const args = {
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1',
        offsetFromBottomMm: 5,
        'flow-rate': 6,
      }

      const result = dispense(args)(invariantContext, robotStateWithTip)

      expect(result.commands).toEqual([
        {
          command: 'dispense',
          params: args,
        },
      ])
    })

    test('dispensing without tip should throw error', () => {
      const result = dispenseWithErrors({
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1',
      })(invariantContext, initialRobotState)

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        type: 'NO_TIP_ON_PIPETTE',
      })
    })

    test('dispense to nonexistent labware should throw error', () => {
      const result = dispenseWithErrors({
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'someBadLabwareId',
        well: 'A1',
      })(invariantContext, robotStateWithTip)

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        type: 'LABWARE_DOES_NOT_EXIST',
      })
    })

    // TODO Ian 2018-02-12... what is excessive volume?
    // Is it OK to dispense vol > pipette max vol?
    // LATER: shouldn't dispense > volume of liquid in pipette
    test.skip('dispense with excessive volume should... ?', () => {})
  })

  describe('liquid tracking', () => {
    const mockLiquidReturnValue = 'expected liquid state'
    beforeEach(() => {
      // $FlowFixMe
      updateLiquidState.mockReturnValue(mockLiquidReturnValue)
    })

    test('dispense calls dispenseUpdateLiquidState with correct args and puts result into robotState.liquidState', () => {
      const result = dispense({
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A1',
        volume: 152,
      })(invariantContext, robotStateWithTip)

      expect(updateLiquidState).toHaveBeenCalledWith(
        {
          invariantContext,
          pipetteId: 'p300SingleId',
          labwareId: 'sourcePlateId',
          volume: 152,
          well: 'A1',
        },
        robotStateWithTip.liquidState
      )

      expect(result.robotState.liquidState).toBe(mockLiquidReturnValue)
    })
  })
})
