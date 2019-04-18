// @flow
import { makeContext, makeState, commandCreatorNoErrors } from './fixtures'
import _dropTip from '../commandCreators/atomic/dropTip'

import updateLiquidState from '../dispenseUpdateLiquidState'

const dropTip = commandCreatorNoErrors(_dropTip)

jest.mock('../dispenseUpdateLiquidState')

describe('dropTip', () => {
  let invariantContext
  let initialRobotState
  let robotStateWithTip
  let makeStateArgs

  beforeEach(() => {
    // TODO IMMEDIATELY this invariantContext/initialRobotState/robotStateWithTip is repeated in aspirate.test.js -- make a fixture helper?
    // NOTE: this one is a little different, b/c we use makeStateArgs as 'describe'-scoped var
    invariantContext = makeContext()
    makeStateArgs = {
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

  function makeRobotState(args: {
    singleHasTips: boolean,
    multiHasTips: boolean,
  }) {
    let _robotState = makeState({
      ...makeStateArgs,
      tiprackSetting: { tiprack1Id: true },
    })
    _robotState.tipState.pipettes.p300SingleId = args.singleHasTips
    _robotState.tipState.pipettes.p300MultiId = args.multiHasTips
    return _robotState
  }

  describe('replaceTip: single channel', () => {
    test('drop tip if there is a tip', () => {
      const result = dropTip('p300SingleId')(
        invariantContext,
        makeRobotState({ singleHasTips: true, multiHasTips: true })
      )

      expect(result.commands).toEqual([
        {
          command: 'drop-tip',
          params: {
            pipette: 'p300SingleId',
            labware: 'trashId',
            well: 'A1',
          },
        },
      ])
      expect(result.robotState).toEqual(
        makeRobotState({ singleHasTips: false, multiHasTips: true })
      )
    })

    test('no tip on pipette, ignore dropTip', () => {
      const initialRobotState = makeRobotState({
        singleHasTips: false,
        multiHasTips: true,
      })
      const result = dropTip('p300SingleId')(
        invariantContext,
        initialRobotState
      )
      expect(result.commands).toEqual([])
      expect(result.robotState).toEqual(initialRobotState)
    })
  })

  describe('Multi-channel dropTip', () => {
    test('drop tip if there is a tip', () => {
      const result = dropTip('p300MultiId')(
        invariantContext,
        makeRobotState({ singleHasTips: true, multiHasTips: true })
      )
      expect(result.commands).toEqual([
        {
          command: 'drop-tip',
          params: {
            pipette: 'p300MultiId',
            labware: 'trashId',
            well: 'A1',
          },
        },
      ])
      expect(result.robotState).toEqual(
        makeRobotState({ singleHasTips: true, multiHasTips: false })
      )
    })

    test('no tip on pipette, ignore dropTip', () => {
      const initialRobotState = makeRobotState({
        singleHasTips: true,
        multiHasTips: false,
      })
      const result = dropTip('p300MultiId')(invariantContext, initialRobotState)
      expect(result.commands).toEqual([])
      expect(result.robotState).toEqual(initialRobotState)
    })
  })

  describe('liquid tracking', () => {
    const mockLiquidReturnValue = 'expected liquid state'
    beforeEach(() => {
      // $FlowFixMe
      updateLiquidState.mockReturnValue(mockLiquidReturnValue)
    })

    test('dropTip calls dispenseUpdateLiquidState with useFullVolume: true', () => {
      const initialRobotState = makeRobotState({
        singleHasTips: true,
        multiHasTips: true,
      })

      const result = dropTip('p300MultiId')(invariantContext, initialRobotState)

      expect(updateLiquidState).toHaveBeenCalledWith(
        {
          invariantContext,
          pipetteId: 'p300MultiId',
          labwareId: 'trashId',
          useFullVolume: true,
          well: 'A1',
        },
        robotStateWithTip.liquidState
      )

      expect(result.robotState.liquidState).toBe(mockLiquidReturnValue)
    })
  })
})
