import EventEmitter from 'events'
import { take } from 'rxjs/operators'

import * as Actions from '../actions'

import type { IpcRenderer } from 'electron'
import type { Remote } from '../types'

describe('shell remote', () => {
  const ipcSend: jest.MockedFunction<IpcRenderer['send']> = jest.fn()
  let ipcRenderer: IpcRenderer
  let remote: Remote

  beforeAll(() => {
    ipcRenderer = Object.assign(new EventEmitter(), {
      send: ipcSend,
    }) as any

    global.APP_SHELL_REMOTE = { ipcRenderer }
    remote = jest.requireActual('../remote').remote
  })

  afterAll(() => {
    delete global.APP_SHELL_REMOTE
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should send dispatches on the "dispatch" channel', () => {
    const action = Actions.uiInitialized()

    remote.dispatch(action)
    expect(ipcSend).toHaveBeenCalledWith('dispatch', action)
  })

  it('should send log entries on the "log" channel', () => {
    const entry = {
      level: 'debug',
      label: 'remote',
      message: 'testing',
    } as const

    remote.log(entry)
    expect(ipcSend).toHaveBeenCalledWith('log', entry)
  })

  it('should wrap incoming actions in an observable', () => {
    const action = Actions.uiInitialized()
    const inbound = remote.inbox.pipe(take(1)).toPromise()

    ipcRenderer.emit('dispatch', { event: true }, action)

    return expect(inbound).resolves.toEqual(action)
  })
})
