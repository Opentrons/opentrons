// @flow
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import {createRobotState} from './fixtures'
import dropTip from '../dropTip'

import updateLiquidState from '../dispenseUpdateLiquidState'

jest.mock('../dispenseUpdateLiquidState')

beforeEach(() => {
  jest.resetAllMocks()
})

function makeRobotState (args: {singleHasTips: boolean, multiHasTips: boolean}) {
  return merge(
    {},
    createRobotState({
      sourcePlateType: 'trough-12row',
      destPlateType: '96-flat',
      tipracks: [200, 200],
      fillPipetteTips: false,
      fillTiprackTips: true
    }),
    {
      tipState: {
        pipettes: {
          p300SingleId: args.singleHasTips,
          p300MultiId: args.multiHasTips
        }
      }
    }
  )
}

describe('replaceTip: single channel', () => {
  test('drop tip if there is a tip', () => {
    const result = dropTip('p300SingleId')(makeRobotState({singleHasTips: true, multiHasTips: true}))
    expect(result.commands).toEqual([{
      command: 'drop-tip',
      pipette: 'p300SingleId',
      labware: 'trashId',
      well: 'A1'
    }])
    expect(result.robotState).toMatchObject(
      omit(
        makeRobotState({singleHasTips: false, multiHasTips: true}),
        'liquidState'
      )
    )
  })

  test('no tip on pipette, ignore dropTip', () => {
    const initialRobotState = makeRobotState({singleHasTips: false, multiHasTips: true})
    const result = dropTip('p300SingleId')(initialRobotState)
    expect(result.commands).toEqual([])
    expect(result.robotState).toEqual(initialRobotState)
  })
})

describe('Multi-channel dropTip', () => {
  test('drop tip if there is a tip', () => {
    const result = dropTip('p300MultiId')(makeRobotState({singleHasTips: true, multiHasTips: true}))
    expect(result.commands).toEqual([{
      command: 'drop-tip',
      pipette: 'p300MultiId',
      labware: 'trashId',
      well: 'A1'
    }])
    expect(result.robotState).toMatchObject(
      omit(
        makeRobotState({singleHasTips: true, multiHasTips: false}),
        'liquidState'
      )
    )
  })

  test('no tip on pipette, ignore dropTip', () => {
    const initialRobotState = makeRobotState({singleHasTips: true, multiHasTips: false})
    const result = dropTip('p300MultiId')(initialRobotState)
    expect(result.commands).toEqual([])
    expect(result.robotState).toEqual(initialRobotState)
  })
})

describe('liquid tracking', () => {
  test('dropTip calls dispenseUpdateLiquidState with the max volume of the pipette', () => {
    const initialRobotState = makeRobotState({singleHasTips: true, multiHasTips: true})

    dropTip('p300MultiId')(initialRobotState)

    expect(updateLiquidState).toHaveBeenCalledTimes(1)

    // trickery for Flow -- there's no .mock on updateLiquidState fn
    const mockCalls: any = updateLiquidState
    const updateArgs: Array<mixed> = mockCalls.mock.calls[0]

    expect(updateArgs[0]).toMatchObject({
      pipetteId: 'p300MultiId',
      labwareId: 'trashId',
      volume: 300, // pipette's max vol
      well: 'A1'
    })
    expect(updateArgs[1]).toEqual(initialRobotState.liquidState)
  })
})
