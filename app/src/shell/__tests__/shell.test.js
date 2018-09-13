// tests for the shell module
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import electron from 'electron'

import {
  mockResolvedValue,
  mockRejectedValue,
} from '../../../__util__/mock-promise'

import {
  checkForShellUpdates,
  downloadShellUpdate,
  quitAndInstallShellUpdate,
  shellReducer,
  shellMiddleware,
  getShellUpdate,
  getShellConfig,
} from '..'

jest.mock('../../logger')
jest.mock('electron')

const middlewares = [thunk, shellMiddleware]
const mockStore = configureMockStore(middlewares)
const {
  './update': mockUpdate,
  './config': mockConfig,
} = electron.__mockRemotes

describe('app shell module', () => {
  let state

  beforeEach(() => {
    jest.clearAllMocks()

    state = {
      shell: {
        update: {
          checkInProgress: false,
          downloadInProgress: false,
          available: null,
          downloaded: false,
          error: null,
          seen: false,
        },
      },
    }
  })

  // quit shell and install is a passthrough to the update remote module
  // doesn't return anything
  test('quitShellAndInstall', () => {
    quitAndInstallShellUpdate()
    expect(mockUpdate.quitAndInstall).toHaveBeenCalled()
  })

  describe('checkForShellUpdates action creator', () => {
    test('handles successful check with update available', () => {
      const store = mockStore({})
      const expectedActions = [
        {type: 'shell:START_UPDATE_CHECK'},
        {
          type: 'shell:FINISH_UPDATE_CHECK',
          payload: {available: '42.0.0', error: null},
        },
      ]

      mockResolvedValue(
        mockUpdate.checkForUpdates,
        {updateAvailable: true, version: '42.0.0'}
      )

      return store.dispatch(checkForShellUpdates())
        .then(() => {
          expect(mockUpdate.checkForUpdates).toHaveBeenCalled()
          expect(store.getActions()).toEqual(expectedActions)
        })
    })

    test('handles successful check with no update', () => {
      const store = mockStore({})
      const expectedActions = [
        {type: 'shell:START_UPDATE_CHECK'},
        {
          type: 'shell:FINISH_UPDATE_CHECK',
          payload: {available: null, error: null},
        },
      ]

      mockResolvedValue(
        mockUpdate.checkForUpdates,
        {updateAvailable: false, version: '42.0.0'}
      )

      return store.dispatch(checkForShellUpdates())
        .then(() => {
          expect(mockUpdate.checkForUpdates).toHaveBeenCalled()
          expect(store.getActions()).toEqual(expectedActions)
        })
    })

    test('handles check error', () => {
      const store = mockStore({})
      const expectedActions = [
        {type: 'shell:START_UPDATE_CHECK'},
        {
          type: 'shell:FINISH_UPDATE_CHECK',
          payload: {error: new Error('AH')},
        },
      ]

      mockRejectedValue(mockUpdate.checkForUpdates, new Error('AH'))

      return store.dispatch(checkForShellUpdates())
        .then(() => {
          expect(mockUpdate.checkForUpdates).toHaveBeenCalled()
          expect(store.getActions()).toEqual(expectedActions)
        })
    })
  })

  describe('downloadShellUpdate action creator', () => {
    test('handles successful download', () => {
      const store = mockStore({})
      const expectedActions = [
        {type: 'shell:START_DOWNLOAD'},
        {type: 'shell:FINISH_DOWNLOAD', payload: {error: null}},
      ]

      mockResolvedValue(mockUpdate.downloadUpdate, null)

      return store.dispatch(downloadShellUpdate())
        .then(() => {
          expect(mockUpdate.downloadUpdate).toHaveBeenCalled()
          expect(store.getActions()).toEqual(expectedActions)
        })
    })

    test('handles failed download', () => {
      const store = mockStore({})
      const expectedActions = [
        {type: 'shell:START_DOWNLOAD'},
        {type: 'shell:FINISH_DOWNLOAD', payload: {error: new Error('AH')}},
      ]

      mockRejectedValue(mockUpdate.downloadUpdate, new Error('AH'))

      return store.dispatch(downloadShellUpdate())
        .then(() => {
          expect(mockUpdate.downloadUpdate).toHaveBeenCalled()
          expect(store.getActions()).toEqual(expectedActions)
        })
    })
  })

  describe('update reducer', () => {
    beforeEach(() => {
      state = state.shell
    })

    test('initial state', () => {
      expect(shellReducer(null, {})).toEqual(state)
    })

    test('handles START_UPDATE_CHECK', () => {
      const action = {type: 'shell:START_UPDATE_CHECK'}

      expect(shellReducer(state, action)).toEqual({
        update: {
          checkInProgress: true,
          downloadInProgress: false,
          available: null,
          downloaded: false,
          error: null,
          seen: false,
        },
      })
    })

    test('handles FINISH_UPDATE_CHECK success', () => {
      state.update.checkInProgress = true
      state.update.error = new Error('some stale error')

      const action = {
        type: 'shell:FINISH_UPDATE_CHECK',
        payload: {available: '42.0.0', error: null},
      }

      expect(shellReducer(state, action)).toEqual({
        update: {
          checkInProgress: false,
          downloadInProgress: false,
          available: '42.0.0',
          downloaded: false,
          error: null,
          seen: false,
        },
      })
    })

    test('handles FINISH_UPDATE_CHECK error', () => {
      state.update.checkInProgress = true
      state.update.available = '42.0.0'

      const action = {
        type: 'shell:FINISH_UPDATE_CHECK',
        payload: {error: new Error('AH')},
      }

      expect(shellReducer(state, action)).toEqual({
        update: {
          checkInProgress: false,
          downloadInProgress: false,
          available: '42.0.0',
          downloaded: false,
          error: new Error('AH'),
          seen: false,
        },
      })
    })

    test('handles START_DOWNLOAD', () => {
      state.update.available = '42.0.0'

      const action = {type: 'shell:START_DOWNLOAD'}

      expect(shellReducer(state, action)).toEqual({
        update: {
          checkInProgress: false,
          downloadInProgress: true,
          available: '42.0.0',
          downloaded: false,
          error: null,
          seen: true,
        },
      })
    })

    test('handles FINISH_DOWNLOAD success', () => {
      state.update.available = '42.0.0'
      state.update.downloadInProgress = true
      state.update.error = new Error('some stale error')

      const action = {
        type: 'shell:FINISH_DOWNLOAD',
        payload: {error: null},
      }

      expect(shellReducer(state, action)).toEqual({
        update: {
          checkInProgress: false,
          downloadInProgress: false,
          available: '42.0.0',
          downloaded: true,
          error: null,
          seen: false,
        },
      })
    })

    test('handles FINISH_DOWNLOAD error', () => {
      state.update.available = '42.0.0'
      state.update.downloadInProgress = true

      const action = {
        type: 'shell:FINISH_DOWNLOAD',
        payload: {error: new Error('AH')},
      }

      expect(shellReducer(state, action)).toEqual({
        update: {
          checkInProgress: false,
          downloadInProgress: false,
          available: '42.0.0',
          downloaded: false,
          error: new Error('AH'),
          seen: false,
        },
      })
    })

    test('handles SET_UPDATE_SEEN', () => {
      state.update.available = '42.0.0'
      const action = {
        type: 'shell:SET_UPDATE_SEEN',
      }
      expect(shellReducer(state, action)).toEqual({
        update: {
          checkInProgress: false,
          downloadInProgress: false,
          available: '42.0.0',
          downloaded: false,
          error: null,
          seen: true,
        },
      })
    })
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

  describe('shell selectors', () => {
    // TODO(mc, 2018-05-11): mockUpdate.CURRENT_VERSION is undefined so this
    //  test isn't really doing anything anymore
    test('getShellUpdate selector', () => {
      expect(getShellUpdate(state)).toEqual({
        ...state.shell.update,
        current: mockUpdate.CURRENT_VERSION,
      })
    })
  })

  describe('config remote', () => {
    test('getShellConfig', () => {
      mockConfig.getConfig.mockReturnValue({isConfig: true})
      expect(getShellConfig()).toEqual({isConfig: true})
    })
  })
})
