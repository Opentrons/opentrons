// tests for the shell module
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import electron from 'electron'

import {shellMiddleware, getShellConfig} from '..'

jest.mock('../../logger')
jest.mock('electron')

const middlewares = [thunk, shellMiddleware]
const mockStore = configureMockStore(middlewares)
const {'./config': mockConfig} = electron.__mockRemotes

describe('app shell module', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('shell middleware', () => {
    test('"dispatches" actions to the app shell if meta.shell', () => {
      const store = mockStore({})
      const action = {type: 'foo', meta: {shell: true}}

      store.dispatch(action)
      expect(electron.ipcRenderer.send).toHaveBeenCalledWith('dispatch', action)
    })

    test('catches actions from main and dispatches them to redux', () => {
      const store = mockStore({})
      const action = {type: 'foo'}

      expect(electron.ipcRenderer.on)
        .toHaveBeenCalledWith('dispatch', expect.any(Function))

      const dispatchHandler = electron.ipcRenderer.on.mock.calls.find(call => {
        return call[0] === 'dispatch' && typeof call[1] === 'function'
      })[1]

      dispatchHandler({}, action)
      expect(store.getActions()).toEqual([action])
    })
  })

  describe('config remote', () => {
    test('getShellConfig', () => {
      mockConfig.getConfig.mockReturnValue({isConfig: true})
      expect(getShellConfig()).toEqual({isConfig: true})
    })
  })
})
