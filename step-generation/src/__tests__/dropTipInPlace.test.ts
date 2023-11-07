import { dropTipInPlace } from '../commandCreators/atomic'
import {
  makeContext,
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  getSuccessResult,
  DEFAULT_PIPETTE,
} from '../fixtures'
import type { RobotState, InvariantContext } from '../types'
import type { DropTipInPlaceArgs } from '../commandCreators/atomic/dropTipInPlace'

const p300SingleId = DEFAULT_PIPETTE

describe('dropTipInPlace', () => {
  let invariantContext: InvariantContext
  let initialRobotState: RobotState
  let robotStateWithTip: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  it('dropTip in place', () => {
    initialRobotState.tipState.pipettes = {
      [p300SingleId]: true,
    }
    const params: DropTipInPlaceArgs = {
      pipetteId: DEFAULT_PIPETTE,
    }
    const result = dropTipInPlace(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'dropTipInPlace',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
        },
      },
    ])
  })
})
