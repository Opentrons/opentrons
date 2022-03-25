import merge from 'lodash/merge'
import { makeImmutableStateUpdater } from '../__utils__'
import {
  getInitialRobotStateStandard,
  makeContext,
  getTipColumn,
  DEFAULT_PIPETTE,
} from '../fixtures'
import { forPickUpTip as _forPickUpTip } from '../getNextRobotStateAndWarnings/forPickUpTip'
import { dispenseUpdateLiquidState } from '../getNextRobotStateAndWarnings/dispenseUpdateLiquidState'
import type { InvariantContext, RobotState } from '../types'

const forPickUpTip = makeImmutableStateUpdater(_forPickUpTip)
jest.mock('../getNextRobotStateAndWarnings/dispenseUpdateLiquidState')
const tiprack1Id = 'tiprack1Id'
const p300SingleId = DEFAULT_PIPETTE
const p300MultiId = 'p300MultiId'
let invariantContext: InvariantContext
let initialRobotState: RobotState
const dispenseUpdateLiquidStateMock = dispenseUpdateLiquidState as jest.MockedFunction<
  typeof dispenseUpdateLiquidState
>
beforeEach(() => {
  invariantContext = makeContext()
  initialRobotState = getInitialRobotStateStandard(invariantContext)
  dispenseUpdateLiquidStateMock.mockClear()
})
describe('tip tracking', () => {
  it('single-channel', () => {
    const params = {
      pipetteId: p300SingleId,
      labwareId: tiprack1Id,
      wellName: 'A1',
    }
    const result = forPickUpTip(params, invariantContext, initialRobotState)
    expect(result.warnings).toEqual([])
    expect(result.robotState).toEqual(
      merge({}, initialRobotState, {
        tipState: {
          tipracks: {
            [tiprack1Id]: {
              A1: false,
            },
          },
          pipettes: {
            [p300SingleId]: true,
          },
        },
      })
    )
  })
  it('multi-channel', () => {
    const params = {
      pipetteId: p300MultiId,
      labwareId: 'tiprack1Id',
      wellName: 'A1',
    }
    const result = forPickUpTip(params, invariantContext, initialRobotState)
    expect(result.warnings).toEqual([])
    expect(result.robotState).toEqual(
      merge({}, initialRobotState, {
        tipState: {
          tipracks: {
            [tiprack1Id]: getTipColumn(1, false),
          },
          pipettes: {
            [p300MultiId]: true,
          },
        },
      })
    )
  })
  // TODO: Ian 2019-11-20 eventually should generate warning (or error?)
  it.todo('multi-channel, missing tip in specified row')
})
