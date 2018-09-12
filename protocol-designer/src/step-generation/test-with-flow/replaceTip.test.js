// @flow
import merge from 'lodash/merge'
import {
  createRobotState,
  getTiprackTipstate,
  getTipColumn,
  commandCreatorNoErrors,
  commandFixtures as cmd,
} from './fixtures'
import _replaceTip from '../replaceTip'

import updateLiquidState from '../dispenseUpdateLiquidState'

const replaceTip = commandCreatorNoErrors(_replaceTip)

jest.mock('../dispenseUpdateLiquidState')

const tiprack1Id = 'tiprack1Id'
const tiprack2Id = 'tiprack2Id'
const p300SingleId = 'p300SingleId'
const p300MultiId = 'p300MultiId'

describe('replaceTip', () => {
  let labwareTypes1
  let robotInitialState
  beforeEach(() => {
    labwareTypes1 = {
      sourcePlateType: 'trough-12row',
      destPlateType: '96-flat',
    }

    robotInitialState = createRobotState({
      ...labwareTypes1,
      fillTiprackTips: true,
      fillPipetteTips: false,
      tipracks: [200, 200],
    })

    // $FlowFixMe: mock methods
    updateLiquidState.mockClear()
    // $FlowFixMe: mock methods
    updateLiquidState.mockReturnValue(robotInitialState.liquidState)
  })

  describe('replaceTip: single channel', () => {
    test('Single-channel: first tip', () => {
      const result = replaceTip(p300SingleId)(robotInitialState)

      expect(result.commands).toEqual([
        cmd.pickUpTip(0),
      ])

      expect(result.robotState).toMatchObject(merge(
        {},
        robotInitialState,
        {
          tipState: {
            tipracks: {
              [tiprack1Id]: {
                A1: false,
              },
            },
            pipettes: {
              p300SingleId: true,
            },
          },
        }
      ))
    })

    test('Single-channel: second tip B1', () => {
      const result = replaceTip(p300SingleId)(merge(
        {},
        robotInitialState,
        {
          tipState: {
            tipracks: {
              [tiprack1Id]: {
                A1: false,
              },
            },
            pipettes: {
              p300SingleId: false,
            },
          },
        }
      ))

      expect(result.commands).toEqual([
        cmd.pickUpTip(1),
      ])

      expect(result.robotState).toMatchObject(merge(
        {},
        robotInitialState,
        {
          tipState: {
            tipracks: {
              [tiprack1Id]: {
                A1: false,
                B1: false,
              },
            },
            pipettes: {
              p300SingleId: true,
            },
          },
        }
      ))
    })

    test('Single-channel: ninth tip (next column)', () => {
      const initialTestRobotState = merge(
        {},
        robotInitialState,
        {
          tipState: {
            tipracks: {
              [tiprack1Id]: getTipColumn(1, false),
            },
            pipettes: {
              p300SingleId: false,
            },
          },
        }
      )

      const result = replaceTip(p300SingleId)(initialTestRobotState)

      expect(result.commands).toEqual([
        cmd.pickUpTip('A2'),
      ])

      expect(result.robotState).toMatchObject(merge(
        {},
        initialTestRobotState,
        {
          tipState: {
            tipracks: {
              [tiprack1Id]: {
                A2: false,
              },
            },
            pipettes: {
              p300SingleId: true,
            },
          },
        }
      ))
    })

    test('Single-channel: pipette already has tip, so tip will be replaced.', () => {
      const initialTestRobotState = merge(
        {},
        robotInitialState,
        {
          tipState: {
            tipracks: {
              [tiprack1Id]: {
                A1: false,
              },
            },
            pipettes: {
              p300SingleId: true,
            },
          },
        }
      )

      const result = replaceTip(p300SingleId)(initialTestRobotState)

      expect(result.commands).toEqual([
        cmd.dropTip('A1'),
        cmd.pickUpTip('B1'),
      ])

      expect(result.robotState).toMatchObject(merge(
        {},
        initialTestRobotState,
        {
          tipState: {
            tipracks: {
              [tiprack1Id]: {
                B1: false,
              },
            },
          },
        }
      ))
    })

    test('Single-channel: used all tips in first rack, move to second rack', () => {
      const initialTestRobotState = merge(
        {},
        robotInitialState,
        {
          tipState: {
            tipracks: {
              [tiprack1Id]: getTiprackTipstate(false),
            },
            pipettes: {
              p300SingleId: false,
            },
          },
        }
      )

      const result = replaceTip(p300SingleId)(initialTestRobotState)

      expect(result.commands).toEqual([
        cmd.pickUpTip('A1', {labware: tiprack2Id}),
      ])

      expect(result.robotState).toMatchObject(merge(
        {},
        initialTestRobotState,
        {
          tipState: {
            tipracks: {
              [tiprack2Id]: {
                A1: false,
              },
            },
            pipettes: {
              p300SingleId: true,
            },
          },
        }
      ))
    })
  })

  describe('replaceTip: multi-channel', () => {
    test('multi-channel, all tipracks have tips', () => {
      const result = replaceTip(p300MultiId)(robotInitialState)

      expect(result.commands).toEqual([
        cmd.pickUpTip('A1', {pipette: p300MultiId}),
      ])

      expect(result.robotState).toMatchObject(merge(
        {},
        robotInitialState,
        {
          tipState: {
            tipracks: {
              [tiprack1Id]: getTipColumn(1, false),
            },
            pipettes: {
              p300MultiId: true,
            },
          },
        }
      ))
    })

    test('multi-channel, missing tip in first row', () => {
      const robotStateWithTipA1Missing = {
        ...robotInitialState,
        tipState: {
          ...robotInitialState.tipState,
          tipracks: {
            [tiprack1Id]: {...getTiprackTipstate(true), A1: false},
            [tiprack2Id]: getTiprackTipstate(true),
          },
        },
      }

      const result = replaceTip(p300MultiId)(robotStateWithTipA1Missing)

      expect(result.commands).toEqual([
        cmd.pickUpTip('A2', {pipette: p300MultiId}),
      ])

      expect(result.robotState).toMatchObject(merge(
        {},
        robotStateWithTipA1Missing,
        {
          tipState: {

            tipracks: {
              [tiprack1Id]: {
                // Column 2 now empty
                A2: false,
                B2: false,
                C2: false,
                D2: false,
                E2: false,
                F2: false,
                G2: false,
                H2: false,
              },
            },
            pipettes: {
              p300MultiId: true,
            },
          },
        }
      ))
    })

    test('Multi-channel: pipette already has tip, so tip will be replaced.', () => {
      const robotStateWithTipsOnMulti = {
        ...robotInitialState,
        tipState: {
          ...robotInitialState.tipState,
          pipettes: {
            p300MultiId: true,
          },
        },
      }
      const result = replaceTip(p300MultiId)(robotStateWithTipsOnMulti)
      expect(result.commands).toEqual([
        cmd.dropTip('A1', {pipette: p300MultiId}),
        cmd.pickUpTip('A1', {pipette: p300MultiId}),
      ])

      expect(result.robotState).toMatchObject(merge(
        {},
        robotStateWithTipsOnMulti,
        {
          tipState: {
            tipracks: {
              [tiprack1Id]: {
                ...getTiprackTipstate(true),
                ...getTipColumn(1, false),
              },
              [tiprack2Id]: getTiprackTipstate(true),
            },
            pipettes: {
              p300MultiId: true,
            },
          },
        }
      ))
    })
  })

  describe('tip assignment', () => {
    let firstTiprackAssignedState
    let twoTipracksAssignedState

    beforeEach(() => {
      firstTiprackAssignedState = {
        [tiprack1Id]: p300MultiId,
      }

      twoTipracksAssignedState = {
        [tiprack1Id]: p300MultiId,
        [tiprack2Id]: p300MultiId,
      }
    })

    test('initial assignment (no tiprackAssignment key)', () => {
      const result = replaceTip(p300MultiId)(robotInitialState)

      expect(result.robotState.tiprackAssignment).toEqual(firstTiprackAssignedState)

      expect(result.commands[0].params).toEqual({
        labware: tiprack1Id,
        pipette: p300MultiId,
        well: 'A1',
      })
    })

    test('use same non-empty tiprack that was already assigned to selected pipette', () => {
      robotInitialState.tiprackAssignment = {...firstTiprackAssignedState}

      const result = replaceTip(p300MultiId)(robotInitialState)

      expect(result.robotState.tiprackAssignment).toEqual({...firstTiprackAssignedState})

      expect(result.commands[0].params).toEqual({
        labware: tiprack1Id,
        pipette: p300MultiId,
        well: 'A1',
      })
    })

    test('get next unassigned tiprack when assigned is empty', () => {
      // first tiprack was previously assigned to our pipette (p300Multi)
      robotInitialState.tiprackAssignment = {...firstTiprackAssignedState}
      // but it's empty
      robotInitialState.tipState.tipracks[tiprack1Id] = getTiprackTipstate(false)

      const result = replaceTip(p300MultiId)(robotInitialState)

      expect(result.robotState.tiprackAssignment).toEqual({...twoTipracksAssignedState})

      expect(result.commands[0].params).toEqual({
        labware: tiprack2Id,
        pipette: p300MultiId,
        well: 'A1',
      })
    })

    test('skip full tiprack when it is assigned to a different pipette', () => {
      robotInitialState.tiprackAssignment = {...firstTiprackAssignedState}

      const result = replaceTip(p300SingleId)(robotInitialState)

      expect(result.robotState.tiprackAssignment).toEqual({
        ...firstTiprackAssignedState,
        [tiprack2Id]: p300SingleId,
      })

      expect(result.commands[0].params).toEqual({
        labware: tiprack2Id,
        pipette: p300SingleId,
        well: 'A1',
      })
    })
  })
})
