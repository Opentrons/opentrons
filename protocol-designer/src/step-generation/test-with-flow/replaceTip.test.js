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
  })

  describe('replaceTip: single channel', () => {
    test('Single-channel: first tip', () => {
      const result = replaceTip(
        { pipette: p300SingleId },
        invariantContext,
        initialRobotState
      )
      const res = getSuccessResult(result)

      expect(res.commands).toEqual([pickUpTipHelper(0)])
    })

    test('Single-channel: second tip B1', () => {
      const result = replaceTip(
        { pipette: p300SingleId },
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

      const result = replaceTip(
        { pipette: p300SingleId },
        invariantContext,
        initialTestRobotState
      )
      const res = getSuccessResult(result)

      expect(res.commands).toEqual([pickUpTipHelper('A2')])
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

      const result = replaceTip(
        { pipette: p300SingleId },
        invariantContext,
        initialTestRobotState
      )
      const res = getSuccessResult(result)

      expect(res.commands).toEqual([dropTipHelper('A1'), pickUpTipHelper('B1')])
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

      const result = replaceTip(
        { pipette: p300SingleId },
        invariantContext,
        initialTestRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        pickUpTipHelper('A1', { labware: tiprack2Id }),
      ])
    })
  })

  describe('replaceTip: multi-channel', () => {
    test('multi-channel, all tipracks have tips', () => {
      const result = replaceTip(
        { pipette: p300MultiId },
        invariantContext,
        initialRobotState
      )
      const res = getSuccessResult(result)

      expect(res.commands).toEqual([
        pickUpTipHelper('A1', { pipette: p300MultiId }),
      ])
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

      const result = replaceTip(
        { pipette: p300MultiId },
        invariantContext,
        robotStateWithTipA1Missing
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        pickUpTipHelper('A2', { pipette: p300MultiId }),
      ])
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
      const result = replaceTip(
        { pipette: p300MultiId },
        invariantContext,
        robotStateWithTipsOnMulti
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        dropTipHelper('A1', { pipette: p300MultiId }),
        pickUpTipHelper('A1', { pipette: p300MultiId }),
      ])
    })
  })
})
