import { TestScheduler } from 'rxjs/testing'

import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { pipettesEpic } from '../../epic'

import type { Action, State } from '../../../types'

const mockState: State = { state: true } as any
const { mockRobot } = Fixtures

describe('fetchPipettesOnConnectEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  it('dispatches FETCH_PIPETTES and FETCH_PIPETTE_SETTINGS on robot:CONNECT', () => {
    const action: Action = {
      type: 'robot:CONNECT',
      payload: { name: mockRobot.name },
    }

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a--', { a: mockState })
      const output$ = pipettesEpic(action$, state$)

      expectObservable(output$).toBe('--(ab)', {
        a: Actions.fetchPipettes(mockRobot.name),
        b: Actions.fetchPipetteSettings(mockRobot.name),
      })
    })
  })
})
