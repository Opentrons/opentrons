// @flow
import merge from 'lodash/merge'
import { makeImmutableStateUpdater } from '../__utils__'
import {
  getInitialRobotStateStandard,
  makeContext,
  getTipColumn,
  DEFAULT_PIPETTE,
} from '../__fixtures__'
import { forPickUpTip as _forPickUpTip } from '../getNextRobotStateAndWarnings/forPickUpTip'

import { dispenseUpdateLiquidState } from '../getNextRobotStateAndWarnings/dispenseUpdateLiquidState'

const forPickUpTip = makeImmutableStateUpdater(_forPickUpTip)

jest.mock('../getNextRobotStateAndWarnings/dispenseUpdateLiquidState')

const tiprack1Id = 'tiprack1Id'
const p300SingleId = DEFAULT_PIPETTE
const p300MultiId = 'p300MultiId'
let invariantContext
let initialRobotState

beforeEach(() => {
  invariantContext = makeContext()
  initialRobotState = getInitialRobotStateStandard(invariantContext)

  // $FlowFixMe: mock methods
  dispenseUpdateLiquidState.mockClear()
  // $FlowFixMe: mock methods
  dispenseUpdateLiquidState.mockReturnValue(initialRobotState.liquidState)
})

describe('tip tracking', () => {
  it('single-channel', () => {
    const params = { pipette: p300SingleId, labware: tiprack1Id, well: 'A1' }

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
      pipette: p300MultiId,
      labware: 'tiprack1Id',
      well: 'A1',
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
