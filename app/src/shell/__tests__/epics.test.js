// tests for the shell module
import { EMPTY } from 'rxjs'
import { take } from 'rxjs/operators'
import { TestScheduler } from 'rxjs/testing'

import { shellEpic } from '../epic'
import { remote as mockRemote } from '../remote'

const { ipcRenderer: mockIpc } = mockRemote

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

    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot('-a', { a: shellAction })
      const output$ = shellEpic(action$)

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
    const result = shellEpic(EMPTY)
      .pipe(take(1))
      .toPromise()

    mockIpc.emit('dispatch', {}, shellAction)

    return expect(result).resolves.toEqual(shellAction)
  })
})
