import { TestScheduler } from 'rxjs/testing'

import { mockRobot } from '../../../robot-api/__fixtures__'

import * as Actions from '../../actions'
import { sessionsEpic } from '../../epic'

import type { Action, State } from '../../../types'

const mockState: State = { state: true } as any

describe('fetchAllSessionsOnConnectEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  it('dispatches FETCH_ALL_SESSIONS on robot:CONNECT success', () => {
    const action: Action = {
      type: 'robot:CONNECT',
      payload: { name: mockRobot.name },
    }

    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a--', { a: mockState })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchAllSessions(mockRobot.name),
      })
    })
  })
})
