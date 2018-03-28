// tests for the shell module
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import electron from 'electron'

import {mockResolvedValue, mockRejectedValue} from '../../../__tests__/util'

import {checkForShellUpdates, shellReducer, getShellUpdate} from '..'

jest.mock('electron')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)
const mockUpdate = electron.__mockRemotes['./update']

describe('app shell module', () => {
  let state

  beforeEach(() => {
    electron.__clearMock()

    state = {
      shell: {
        update: {
          inProgress: false,
          available: null,
          error: null
        }
      }
    }
  })

  describe('checkForShellUpdates action creator', () => {
    test('handles successful check with update available', () => {
      const store = mockStore({})
      const expectedActions = [
        {type: 'shell:START_UPDATE_CHECK'},
        {
          type: 'shell:FINISH_UPDATE_CHECK',
          payload: {available: '42.0.0', error: null}
        }
      ]

      mockResolvedValue(mockUpdate.checkForUpdates, '42.0.0')

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
          payload: {available: null, error: null}
        }
      ]

      mockResolvedValue(mockUpdate.checkForUpdates, null)

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
          payload: {error: new Error('AH')}
        }
      ]

      mockRejectedValue(mockUpdate.checkForUpdates, new Error('AH'))

      return store.dispatch(checkForShellUpdates())
        .then(() => {
          expect(mockUpdate.checkForUpdates).toHaveBeenCalled()
          expect(store.getActions()).toEqual(expectedActions)
        })
    })
  })

  describe('reducer', () => {
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
          inProgress: true,
          available: null,
          error: null
        }
      })
    })

    test('handles FINISH_UPDATE_CHECK success', () => {
      state.update.inProgress = true
      state.update.error = new Error('some stale error')

      const action = {
        type: 'shell:FINISH_UPDATE_CHECK',
        payload: {available: '42.0.0', error: null}
      }

      expect(shellReducer(state, action)).toEqual({
        update: {
          inProgress: false,
          available: '42.0.0',
          error: null
        }
      })
    })

    test('handles FINISH_UPDATE_CHECK error', () => {
      state.update.inProgress = true
      state.update.available = '42.0.0'

      const action = {
        type: 'shell:FINISH_UPDATE_CHECK',
        payload: {error: new Error('AH')}
      }

      expect(shellReducer(state, action)).toEqual({
        update: {
          inProgress: false,
          available: '42.0.0',
          error: new Error('AH')
        }
      })
    })
  })

  describe('shell selectors', () => {
    test('getShellUpdate selector', () => {
      expect(getShellUpdate(state)).toBe(state.shell.update)
    })
  })
})
