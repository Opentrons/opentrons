import { TestScheduler } from 'rxjs/testing'

import * as actions from '../actions'
import * as epics from '../epics'

describe('discovery actions', () => {
  let testScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  test('startDiscoveryEpic with default timeout', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot('-a', { a: actions.startDiscovery() })
      const output$ = epics.startDiscoveryEpic(action$)

      expectObservable(output$).toBe('- 30000ms a ', {
        a: actions.finishDiscovery(),
      })
    })
  })

  test('startDiscoveryEpic with specified timeout', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot('-a', { a: actions.startDiscovery(42) })
      const output$ = epics.startDiscoveryEpic(action$)

      expectObservable(output$).toBe('- 42ms a ', {
        a: actions.finishDiscovery(),
      })
    })
  })

  test('startDiscoveryOnRestartEpic', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const serverSuccessAction = {
        type: 'api:SERVER_SUCCESS',
        payload: { path: 'restart' },
      }

      const action$ = hot('-a', { a: serverSuccessAction })
      const output$ = epics.startDiscoveryOnRestartEpic(action$)

      expectObservable(output$).toBe('-a ', {
        a: actions.startDiscovery(60000),
      })
    })
  })
})
