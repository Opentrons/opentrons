import { TestScheduler } from 'rxjs/testing'

import * as Shell from '../../shell'
import * as Actions from '../actions'
import { discoveryEpic } from '../epic'

import type { Action, State } from '../../types'

describe('discovery actions', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  it('startDiscoveryEpic with default timeout', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot<Action>('-a', { a: Actions.startDiscovery() })
      const state$ = hot<State>('s-', {})
      const output$ = discoveryEpic(action$, state$)

      expectObservable(output$).toBe('- 30000ms a ', {
        a: Actions.finishDiscovery(),
      })
    })
  })

  it('startDiscoveryEpic with specified timeout', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot<Action>('-a', { a: Actions.startDiscovery(42) })
      const state$ = hot<State>('s-', {})
      const output$ = discoveryEpic(action$, state$)

      expectObservable(output$).toBe('- 42ms a ', {
        a: Actions.finishDiscovery(),
      })
    })
  })

  it('startDiscoveryEpic with shell:UI_INITIALIZED', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot<Action>('-a', { a: Shell.uiInitialized() })
      const state$ = hot<State>('s-', {})
      const output$ = discoveryEpic(action$, state$)

      expectObservable(output$).toBe('- 30000ms a ', {
        a: Actions.finishDiscovery(),
      })
    })
  })

  it('startDiscoveryOnRestartEpic', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const serverSuccessAction = {
        type: 'api:SERVER_SUCCESS',
        payload: { path: 'restart' },
      }

      const action$ = hot<Action>('-a', { a: serverSuccessAction } as any)
      const state$ = hot<State>('s-', {})
      const output$ = discoveryEpic(action$, state$)

      expectObservable(output$).toBe('-a ', {
        a: Actions.startDiscovery(60000),
      })
    })
  })
})
