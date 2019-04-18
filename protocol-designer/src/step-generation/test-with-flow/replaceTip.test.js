// @flow
import merge from 'lodash/merge'
import {
  makeContext,
  makeState,
  getTiprackTipstate,
  getTipColumn,
  commandCreatorNoErrors,
  commandFixtures as cmd,
} from './fixtures'
import _replaceTip from '../commandCreators/atomic/replaceTip'

import updateLiquidState from '../dispenseUpdateLiquidState'

const replaceTip = commandCreatorNoErrors(_replaceTip)

jest.mock('../dispenseUpdateLiquidState')

const tiprack1Id = 'tiprack1Id'
const tiprack2Id = 'tiprack2Id'
const p300SingleId = 'p300SingleId'
const p300MultiId = 'p300MultiId'

describe('replaceTip', () => {
  let invariantContext
  let initialRobotState
  beforeEach(() => {
    // TODO IMMEDIATELY this invariantContext/initialRobotState/robotStateWithTip is repeated in aspirate.test.js -- make a fixture helper?
    invariantContext = makeContext()
    const makeStateArgs = {
      invariantContext,
      pipetteLocations: {
        p300SingleId: { mount: 'left' },
        p300MultiId: { mount: 'right' },
      },
      labwareLocations: {
        tiprack1Id: { slot: '1' },
        tiprack2Id: { slot: '2' },
        sourcePlateId: { slot: '3' },
      },
    }
    initialRobotState = makeState({
      ...makeStateArgs,
      tiprackSetting: { tiprack1Id: true, tiprack2Id: true },
    })
    // $FlowFixMe: mock methods
    updateLiquidState.mockClear()
    // $FlowFixMe: mock methods
    updateLiquidState.mockReturnValue(initialRobotState.liquidState)
  })

  describe('replaceTip: single channel', () => {
    test('Single-channel: first tip', () => {
      console.log('zzz', invariantContext.pipetteEntities)
      const result = replaceTip(p300SingleId)(
        invariantContext,
        initialRobotState
      )

      expect(result.commands).toEqual([cmd.pickUpTip(0)])

      expect(result.robotState).toMatchObject(
        merge({}, initialRobotState, {
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
        })
      )
    })

    test('Single-channel: second tip B1', () => {
      const result = replaceTip(p300SingleId)(
        invariantContext,
        merge({}, initialRobotState, {
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
        })
      )

      expect(result.commands).toEqual([cmd.pickUpTip(1)])

      expect(result.robotState).toMatchObject(
        merge({}, initialRobotState, {
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
        })
      )
    })

    test('Single-channel: ninth tip (next column)', () => {
      const initialTestRobotState = merge({}, initialRobotState, {
        tipState: {
          tipracks: {
            [tiprack1Id]: getTipColumn(1, false),
          },
          pipettes: {
            p300SingleId: false,
          },
        },
      })

      const result = replaceTip(p300SingleId)(
        invariantContext,
        initialTestRobotState
      )

      expect(result.commands).toEqual([cmd.pickUpTip('A2')])

      expect(result.robotState).toMatchObject(
        merge({}, initialTestRobotState, {
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
        })
      )
    })

    test('Single-channel: pipette already has tip, so tip will be replaced.', () => {
      const initialTestRobotState = merge({}, initialRobotState, {
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
      })

      const result = replaceTip(p300SingleId)(
        invariantContext,
        initialTestRobotState
      )

      expect(result.commands).toEqual([cmd.dropTip('A1'), cmd.pickUpTip('B1')])

      expect(result.robotState).toMatchObject(
        merge({}, initialTestRobotState, {
          tipState: {
            tipracks: {
              [tiprack1Id]: {
                B1: false,
              },
            },
          },
        })
      )
    })

    test('Single-channel: used all tips in first rack, move to second rack', () => {
      const initialTestRobotState = merge({}, initialRobotState, {
        tipState: {
          tipracks: {
            [tiprack1Id]: getTiprackTipstate(false),
          },
          pipettes: {
            p300SingleId: false,
          },
        },
      })

      const result = replaceTip(p300SingleId)(
        invariantContext,
        initialTestRobotState
      )

      expect(result.commands).toEqual([
        cmd.pickUpTip('A1', { labware: tiprack2Id }),
      ])

      expect(result.robotState).toMatchObject(
        merge({}, initialTestRobotState, {
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
        })
      )
    })
  })

  describe('replaceTip: multi-channel', () => {
    test('multi-channel, all tipracks have tips', () => {
      const result = replaceTip(p300MultiId)(
        invariantContext,
        initialRobotState
      )

      expect(result.commands).toEqual([
        cmd.pickUpTip('A1', { pipette: p300MultiId }),
      ])

      expect(result.robotState).toMatchObject(
        merge({}, initialRobotState, {
          tipState: {
            tipracks: {
              [tiprack1Id]: getTipColumn(1, false),
            },
            pipettes: {
              p300MultiId: true,
            },
          },
        })
      )
    })

    test('multi-channel, missing tip in first row', () => {
      const robotStateWithTipA1Missing = {
        ...initialRobotState,
        tipState: {
          ...initialRobotState.tipState,
          tipracks: {
            [tiprack1Id]: { ...getTiprackTipstate(true), A1: false },
            [tiprack2Id]: getTiprackTipstate(true),
          },
        },
      }

      const result = replaceTip(p300MultiId)(
        invariantContext,
        robotStateWithTipA1Missing
      )

      expect(result.commands).toEqual([
        cmd.pickUpTip('A2', { pipette: p300MultiId }),
      ])

      expect(result.robotState).toMatchObject(
        merge({}, robotStateWithTipA1Missing, {
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
        })
      )
    })

    test('Multi-channel: pipette already has tip, so tip will be replaced.', () => {
      const robotStateWithTipsOnMulti = {
        ...initialRobotState,
        tipState: {
          ...initialRobotState.tipState,
          pipettes: {
            p300MultiId: true,
          },
        },
      }
      const result = replaceTip(p300MultiId)(
        invariantContext,
        robotStateWithTipsOnMulti
      )
      expect(result.commands).toEqual([
        cmd.dropTip('A1', { pipette: p300MultiId }),
        cmd.pickUpTip('A1', { pipette: p300MultiId }),
      ])

      expect(result.robotState).toMatchObject(
        merge({}, robotStateWithTipsOnMulti, {
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
        })
      )
    })
  })
})
