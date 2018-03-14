// @flow
import merge from 'lodash/merge'
import {createRobotState} from './fixtures'
import dropTip from '../dropTip'

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
    expect(result.robotState).toEqual(makeRobotState({singleHasTips: false, multiHasTips: true}))
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
    expect(result.robotState).toEqual(makeRobotState({singleHasTips: true, multiHasTips: false}))
  })

  test('no tip on pipette, ignore dropTip', () => {
    const initialRobotState = makeRobotState({singleHasTips: true, multiHasTips: false})
    const result = dropTip('p300MultiId')(initialRobotState)
    expect(result.commands).toEqual([])
    expect(result.robotState).toEqual(initialRobotState)
  })
})
