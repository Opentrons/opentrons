// @flow
import {filledTiprackWells, p300Single, p300Multi} from './fixtures'
import {dropTip, type RobotState} from '../'

const makeRobotState = ({singleHasTips, multiHasTips}: {singleHasTips: boolean, multiHasTips: boolean}): RobotState => ({
  instruments: {
    p300SingleId: p300Single,
    p300MultiId: p300Multi
  },
  labware: {
    tiprack1Id: {
      slot: '1',
      type: 'tiprack-200uL',
      name: 'Tip rack'
    },
    tiprack10Id: {
      slot: '10',
      type: 'tiprack-200uL',
      name: 'Tip rack'
    },
    sourcePlateId: {
      slot: '11',
      type: 'trough-12row',
      name: 'Source (Buffer)'
    },
    destPlateId: {
      slot: '8',
      type: '96-flat',
      name: 'Destination Plate'
    },
    trashId: {
      slot: '12',
      type: 'fixed-trash',
      name: 'Trash'
    }
  },
  tipState: {
    tipracks: {
      tiprack1Id: {...filledTiprackWells},
      tiprack10Id: {...filledTiprackWells}
    },
    pipettes: {
      p300SingleId: singleHasTips,
      p300MultiId: multiHasTips
    }
  }
})

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
