/* globals events$EventEmitter */
// @flow
import EventEmitter from 'events'
import { take } from 'rxjs/operators'

import * as Actions from '../actions'

import type { Remote } from '../types'

interface MockIpcRenderer extends events$EventEmitter {
  send: JestMockFn<Array<mixed>, void>;
}

const ipcRenderer: MockIpcRenderer = Object.assign(new EventEmitter(), {
  send: jest.fn(),
})

describe('shell remote', () => {
  let remote: Remote

  beforeAll(() => {
    global.APP_SHELL_REMOTE = { ipcRenderer }
    remote = jest.requireActual('../remote').remote
  })

  afterAll(() => {
    delete global.APP_SHELL_REMOTE
  })

  afterEach(() => {
    ipcRenderer.removeAllListeners()
    jest.resetAllMocks()
  })

  it('should send dispatches on the "dispatch" channel', () => {
    const action = Actions.uiInitialized()

    remote.dispatch(action)
    expect(ipcRenderer.send).toHaveBeenCalledWith('dispatch', action)
  })

  it('should send log entries on the "log" channel', () => {
    const entry = { level: 'debug', label: 'remote', message: 'testing' }

    remote.log(entry)
    expect(ipcRenderer.send).toHaveBeenCalledWith('log', entry)
  })

  it('should wrap incoming actions in an observable', () => {
    const action = Actions.uiInitialized()
    const inbound = remote.inbox.pipe(take(1)).toPromise()

    ipcRenderer.emit('dispatch', { event: true }, action)

    return expect(inbound).resolves.toEqual(action)
  })
})
