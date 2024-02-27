import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EMPTY } from 'rxjs'
import { TestScheduler } from 'rxjs/testing'
import { take } from 'rxjs/operators'

import * as Alerts from '../../alerts'
import * as Config from '../../config'
import * as ShellUpdate from '../update'
import { remote as mockRemote } from '../remote'
import { shellEpic } from '../epic'

import type { Action, State } from '../../types'

const { ipcRenderer: mockIpc } = mockRemote

vi.mock('../../config')
vi.mock('../remote')

// TODO(mc, 2020-10-08): this is a partial mock because shell/update
// needs some reorg to split actions and selectors
vi.mock('../update', async importOriginal => {
  const actual = await importOriginal<
    typeof ShellUpdate.getAvailableShellUpdate
  >()
  return {
    ...actual,
    getAvailableShellUpdate: vi.fn(),
  }
})

describe('shell epics', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('"dispatches" actions to IPC if meta.shell', () => {
    const shellAction: Action = { type: 'foo', meta: { shell: true } } as any

    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot<Action>('-a', { a: shellAction })
      const output$ = shellEpic(action$, EMPTY)

      expectObservable(output$).toBe('--')
    })

    // NOTE: this expectation has to outside the testScheduler scope or else
    // everything breaks for some reason
    expect(mockIpc.send).toHaveBeenCalledWith('dispatch', shellAction)
  })

  // due to the use of `fromEvent`, this test doesn't work well as a marble
  // test. `toPromise` based expectation should be sufficient
  it('catches actions from main', () => {
    const shellAction = { type: 'bar' }
    const result = shellEpic(EMPTY, EMPTY).pipe(take(1)).toPromise()

    ;(mockIpc as any).emit('dispatch', {}, shellAction)

    return expect(result).resolves.toEqual(shellAction)
  })

  it('triggers an appUpdateAvailable alert if an app update becomes available', () => {
    const mockState: State = { mockState: true } as any

    vi.mocked(ShellUpdate.getAvailableShellUpdate).mockReturnValueOnce(null)
    vi.mocked(ShellUpdate.getAvailableShellUpdate).mockReturnValue('1.2.3')

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

    vi.mocked(Config.getUpdateChannel).mockReturnValueOnce('latest')
    vi.mocked(Config.getUpdateChannel).mockReturnValue('beta')

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
