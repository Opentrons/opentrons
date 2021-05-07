import { TestScheduler } from 'rxjs/testing'
import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../../../robot'
import * as Actions from '../../actions'
import { labwareCalibrationEpic } from '..'

import type { State } from '../../../../types'
import type { Observable } from 'rxjs'

jest.mock('../../actions')
jest.mock('../../../../robot/selectors')

const mockGetConnectedRobotName = robotSelectors.getConnectedRobotName as jest.MockedFunction<
  typeof robotSelectors.getConnectedRobotName
>

describe('fetch labware calibration on rpc cal session update epic', () => {
  beforeEach(() => {
    mockGetConnectedRobotName.mockReturnValue('robotName')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches calibration:FETCH_LABWARE_CALIBRATIONS on robot:UPDATE_OFFSET_SUCCESS', () => {
    const mockState: State = { state: true, mock: true } as any

    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })

    testScheduler.run(schedulerArgs => {
      const { hot, expectObservable, flush } = schedulerArgs

      const action$ = hot('--a', { a: robotActions.updateOffsetResponse() })
      const state$: Observable<State> = hot('s-s', { s: mockState })
      const output$ = labwareCalibrationEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(Actions.fetchLabwareCalibrations).toHaveBeenCalledWith('robotName')
    })
  })

  it('dispatches calibration:FETCH_LABWARE_CALIBRATIONS on robot:CONFIRM_TIPRACK_SUCCESS', () => {
    const mockState: State = { state: true, mock: true } as any

    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })

    testScheduler.run(schedulerArgs => {
      const { hot, expectObservable, flush } = schedulerArgs

      const action$ = hot('--a', { a: robotActions.confirmTiprackResponse() })
      const state$: Observable<State> = hot('s-s', { s: mockState })
      const output$ = labwareCalibrationEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(Actions.fetchLabwareCalibrations).toHaveBeenCalledWith('robotName')
    })
  })
})
