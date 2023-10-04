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
} from '../fixtures'
import { FIXED_TRASH_ID } from '..'
import { replaceTip } from '../commandCreators/atomic/replaceTip'
import type { InvariantContext, RobotState } from '../types'

const tiprack1Id = 'tiprack1Id'
const tiprack2Id = 'tiprack2Id'
const p300SingleId = DEFAULT_PIPETTE
const p300MultiId = 'p300MultiId'
describe('replaceTip', () => {
  let invariantContext: InvariantContext
  let initialRobotState: RobotState
  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
  })
  describe('replaceTip: single channel', () => {
    it('Single-channel: first tip', () => {
      const result = replaceTip(
        {
          pipette: p300SingleId,
          dropTipLocation: FIXED_TRASH_ID,
        },
        invariantContext,
        initialRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([pickUpTipHelper(0)])
    })
    it('Single-channel: second tip B1', () => {
      const result = replaceTip(
        {
          pipette: p300SingleId,
          dropTipLocation: FIXED_TRASH_ID,
        },
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
    it('Single-channel: ninth tip (next column)', () => {
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
        {
          pipette: p300SingleId,
          dropTipLocation: FIXED_TRASH_ID,
        },
        invariantContext,
        initialTestRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([pickUpTipHelper('A2')])
    })
    it('Single-channel: pipette already has tip, so tip will be replaced.', () => {
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
        {
          pipette: p300SingleId,
          dropTipLocation: FIXED_TRASH_ID,
        },
        invariantContext,
        initialTestRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([dropTipHelper('A1'), pickUpTipHelper('B1')])
    })
    it('Single-channel: used all tips in first rack, move to second rack', () => {
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
        {
          pipette: p300SingleId,
          dropTipLocation: FIXED_TRASH_ID,
        },
        invariantContext,
        initialTestRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        pickUpTipHelper('A1', {
          labwareId: tiprack2Id,
        }),
      ])
    })
  })
  describe('replaceTip: multi-channel', () => {
    it('multi-channel, all tipracks have tips', () => {
      const result = replaceTip(
        {
          pipette: p300MultiId,
          dropTipLocation: FIXED_TRASH_ID,
        },
        invariantContext,
        initialRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        pickUpTipHelper('A1', {
          pipetteId: p300MultiId,
        }),
      ])
    })
    it('multi-channel, missing tip in first row', () => {
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
        {
          pipette: p300MultiId,
          dropTipLocation: FIXED_TRASH_ID,
        },
        invariantContext,
        robotStateWithTipA1Missing
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        pickUpTipHelper('A2', {
          pipetteId: p300MultiId,
        }),
      ])
    })
    it('Multi-channel: pipette already has tip, so tip will be replaced.', () => {
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
        {
          pipette: p300MultiId,
          dropTipLocation: FIXED_TRASH_ID,
        },
        invariantContext,
        robotStateWithTipsOnMulti
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        dropTipHelper('A1', {
          pipetteId: p300MultiId,
        }),
        pickUpTipHelper('A1', {
          pipetteId: p300MultiId,
        }),
      ])
    })
  })
})
