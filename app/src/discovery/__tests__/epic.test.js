import { TestScheduler } from 'rxjs/testing'

import * as Shell from '../../shell'
import * as Actions from '../actions'
import { discoveryEpic } from '../epic'

describe('discovery actions', () => {
  let testScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  it('startDiscoveryEpic with default timeout', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot('-a', { a: Actions.startDiscovery() })
      const output$ = discoveryEpic(action$)

      expectObservable(output$).toBe('- 30000ms a ', {
        a: Actions.finishDiscovery(),
      })
    })
  })

  it('startDiscoveryEpic with specified timeout', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot('-a', { a: Actions.startDiscovery(42) })
      const output$ = discoveryEpic(action$)

      expectObservable(output$).toBe('- 42ms a ', {
        a: Actions.finishDiscovery(),
      })
    })
  })

  it('startDiscoveryEpic with shell:UI_INITIALIZED', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot('-a', { a: Shell.uiInitialized() })
      const output$ = discoveryEpic(action$)

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

      const action$ = hot('-a', { a: serverSuccessAction })
      const output$ = discoveryEpic(action$)

      expectObservable(output$).toBe('-a ', {
        a: Actions.startDiscovery(60000),
      })
    })
  })
})
