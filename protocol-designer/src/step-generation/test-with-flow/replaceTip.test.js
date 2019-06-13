// @flow
import merge from 'lodash/merge'
import {
  getInitialRobotStateStandard,
  makeContext,
  getTiprackTipstate,
  getTipColumn,
  getSuccessResult,
  pickUpTipHelper,
  dropTipHelper,
  DEFAULT_PIPETTE,
} from './fixtures'
import replaceTip from '../commandCreators/atomic/replaceTip'
import updateLiquidState from '../dispenseUpdateLiquidState'

jest.mock('../dispenseUpdateLiquidState')

// TODO: Ian 2019-07-13 move these strings into commandFixtures
const tiprack1Id = 'tiprack1Id'
const tiprack2Id = 'tiprack2Id'
const p300SingleId = DEFAULT_PIPETTE
const p300MultiId = 'p300MultiId'

describe('replaceTip', () => {
  let invariantContext
  let initialRobotState
  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)

    // $FlowFixMe: mock methods
    updateLiquidState.mockClear()
    // $FlowFixMe: mock methods
    updateLiquidState.mockReturnValue(initialRobotState.liquidState)
  })

  describe('replaceTip: single channel', () => {
    test('Single-channel: first tip', () => {
      const result = replaceTip(p300SingleId)(
        invariantContext,
        initialRobotState
      )
      const res = getSuccessResult(result)

      expect(res.commands).toEqual([pickUpTipHelper(0)])

      expect(res.robotState).toMatchObject(
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
      const res = getSuccessResult(result)

      expect(res.commands).toEqual([pickUpTipHelper(1)])

      expect(res.robotState).toMatchObject(
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
      const res = getSuccessResult(result)

      expect(res.commands).toEqual([pickUpTipHelper('A2')])

      expect(res.robotState).toMatchObject(
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
      const res = getSuccessResult(result)

      expect(res.commands).toEqual([dropTipHelper('A1'), pickUpTipHelper('B1')])

      expect(res.robotState).toMatchObject(
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
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        pickUpTipHelper('A1', { labware: tiprack2Id }),
      ])

      expect(res.robotState).toMatchObject(
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
      const res = getSuccessResult(result)

      expect(res.commands).toEqual([
        pickUpTipHelper('A1', { pipette: p300MultiId }),
      ])
      expect(res.robotState).toMatchObject(
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
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        pickUpTipHelper('A2', { pipette: p300MultiId }),
      ])

      expect(res.robotState).toMatchObject(
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
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        dropTipHelper('A1', { pipette: p300MultiId }),
        pickUpTipHelper('A1', { pipette: p300MultiId }),
      ])

      expect(res.robotState).toMatchObject(
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
