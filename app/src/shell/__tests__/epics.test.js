// @flow
// tests for the shell module
import { EMPTY } from 'rxjs'
import { TestScheduler } from 'rxjs/testing'
import { take } from 'rxjs/operators'

import { remote } from '../remote'
import { shellEpic } from '../epic'

import type { Action } from '../../types'

const remoteDispatch: JestMockFn<[Action], void> = remote.dispatch
const triggerRemoteAction: Action => void = (remote: any).__triggerAction

describe('shell epics', () => {
  let testScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('sendActionToShellEpic "dispatches" actions to IPC if meta.shell', () => {
    const shellAction = { type: 'foo', meta: { shell: true } }

    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action$ = hot('-a', { a: shellAction })
      const output$ = shellEpic(action$, EMPTY)

      expectObservable(output$).toBe('--')
      flush()

      expect(remoteDispatch).toHaveBeenCalledWith(shellAction)
    })
  })

  // due to the use of `fromEvent`, this test doesn't work well as a marble
  // test. `toPromise` based expectation should be sufficient
  it('catches actions from main', () => {
    const shellAction: Action = ({ type: 'bar' }: any)
    const result = shellEpic(EMPTY, EMPTY)
      .pipe(take(1))
      .toPromise()

    triggerRemoteAction(shellAction)

    return expect(result).resolves.toEqual(shellAction)
  })
})
