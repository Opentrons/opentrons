// tests for the shell module
import { EMPTY, Subject } from 'rxjs'
import { TestScheduler } from 'rxjs/testing'

import * as Alerts from '../../alerts'
import * as Config from '../../config'
import * as ShellUpdate from '../update'
import { remote } from '../remote'
import { shellEpic } from '../epic'

import type { Action, State } from '../../types'

const remoteDispatch = remote.dispatch as jest.MockedFunction<
  typeof remote.dispatch
>

jest.mock('../../config')

// TODO(mc, 2020-10-08): this is a partial mock because shell/update
// needs some reorg to split actions and selectors
jest.mock('../update', () => ({
  ...jest.requireActual<{}>('../update'),
  getAvailableShellUpdate: jest.fn(),
}))

const getUpdateChannel = Config.getUpdateChannel as jest.MockedFunction<
  typeof Config.getUpdateChannel
>

const getAvailableShellUpdate = ShellUpdate.getAvailableShellUpdate as jest.MockedFunction<
  typeof ShellUpdate.getAvailableShellUpdate
>

describe('shell epics', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('sendActionToShellEpic "dispatches" actions to IPC if meta.shell', () => {
    const shellAction: Action = { type: 'foo', meta: { shell: true } } as any

    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action$ = hot<Action>('-a', { a: shellAction })
      const output$ = shellEpic(action$, EMPTY)

      expectObservable(output$).toBe('--')
      flush()

      expect(remoteDispatch).toHaveBeenCalledWith(shellAction)
    })
  })

  it('catches actions from main', () => {
    const mockAction: Action = { type: 'foo' } as any

    testScheduler.run(({ cold, expectObservable }) => {
      const output$ = shellEpic(EMPTY, EMPTY)

      cold('-a').subscribe(() => {
        // NOTE: the mock remote uses a Subject as the inbox
        // so we can inject actions
        const inbox = remote.inbox as Subject<Action>
        inbox.next(mockAction)
      })

      expectObservable(output$).toBe('-a', { a: mockAction })
    })
  })

  it('triggers an appUpdateAvailable alert if an app update becomes available', () => {
    const mockState: State = { mockState: true } as any

    getAvailableShellUpdate.mockReturnValueOnce(null)
    getAvailableShellUpdate.mockReturnValue('1.2.3')

    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot<Action>('----')
      const state$ = hot<State>('-a-a-a', { a: mockState })
      const output$ = shellEpic(action$, state$)

      // we only expect the alert to be triggered when state goes from null
      // to an update version
      expectObservable(output$).toBe('---a--', {
        a: Alerts.alertTriggered(Alerts.ALERT_APP_UPDATE_AVAILABLE),
      })
    })
  })

  it('should trigger a shell:CHECK_UPDATE action if the update channel changes', () => {
    const mockState: State = { mockState: true } as any

    getUpdateChannel.mockReturnValueOnce('latest')
    getUpdateChannel.mockReturnValue('beta')

    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot<Action>('------')
      const state$ = hot<State>('-a-a-a', { a: mockState })
      const output$ = shellEpic(action$, state$)

      // we only expect the alert to be triggered when state changes
      expectObservable(output$).toBe('---a--', {
        a: ShellUpdate.checkShellUpdate(),
      })
    })
  })
})
