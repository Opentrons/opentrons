import { TestScheduler } from 'rxjs/testing'
import * as Actions from '../../actions'
import { pipetteOffsetCalibrationsEpic } from '..'

import type { Action, State } from '../../../../types'

jest.mock('../../actions')
jest.mock('../../../../robot/selectors')
jest.mock('../../../../discovery/selectors')

const mockState = { state: true }
const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 } as any

describe('fetchPipetteOffsetCalibrationsOnConnectEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches FETCH_PIPETTE_OFFSET_CALIBRATIONS on robot:CONNECT', () => {
    const action = {
      type: 'robot:CONNECT',
      payload: { name: mockRobot.name },
    }

    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot<Action>('--a', { a: action } as any)
      const state$ = hot<State>('a--', { a: mockState } as any)
      const output$ = pipetteOffsetCalibrationsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchPipetteOffsetCalibrations(mockRobot.name),
      })
    })
  })
})
