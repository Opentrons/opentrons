// connection reducer tests
import {reducer, actionTypes} from '../'

const getState = (state) => state.connection

describe('robot reducer - connection', () => {
  test('initial state', () => {
    const state = reducer(undefined, {})

    expect(getState(state)).toEqual({
      isConnected: false,
      connectRequest: {inProgress: false, error: null},
      disconnectRequest: {inProgress: false, error: null}
    })
  })

  test('handles CONNECT action', () => {
    const state = {
      connection: {
        isConnected: false,
        connectRequest: {inProgress: false, error: new Error('AH')}
      }
    }
    const action = {type: actionTypes.CONNECT}

    expect(getState(reducer(state, action))).toEqual({
      isConnected: false,
      connectRequest: {inProgress: true, error: null}
    })
  })

  test('handles CONNECT_RESPONSE success', () => {
    const state = {
      connection: {
        isConnected: false,
        connectRequest: {inProgress: true, error: null}
      }
    }
    const action = {type: actionTypes.CONNECT_RESPONSE, error: false}

    expect(getState(reducer(state, action))).toEqual({
      isConnected: true,
      connectRequest: {inProgress: false, error: null}
    })
  })

  test('handles CONNECT_RESPONSE failure', () => {
    const state = {
      connection: {
        isConnected: false,
        connectRequest: {inProgress: true, error: null}
      }
    }
    const action = {
      type: actionTypes.CONNECT_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(getState(reducer(state, action))).toEqual({
      isConnected: false,
      connectRequest: {inProgress: false, error: new Error('AH')}
    })
  })

  test('handles DISCONNECT action', () => {
    const state = {
      connection: {
        isConnected: true,
        disconnectRequest: {inProgress: false, error: new Error('AH')}
      }
    }
    const action = {type: actionTypes.DISCONNECT}

    expect(getState(reducer(state, action))).toEqual({
      isConnected: true,
      disconnectRequest: {inProgress: true, error: null}
    })
  })

  test('handles DISCONNECT_RESPONSE success', () => {
    const state = {
      connection: {
        isConnected: true,
        disconnectRequest: {inProgress: true, error: null}
      }
    }
    const action = {type: actionTypes.DISCONNECT_RESPONSE, error: false}

    expect(getState(reducer(state, action))).toEqual({
      isConnected: false,
      disconnectRequest: {inProgress: false, error: null}
    })
  })

  test('handles DISCONNECT_RESPONSE failure', () => {
    const state = {
      connection: {
        isConnected: true,
        disconnectRequest: {inProgress: true, error: null}
      }
    }
    const action = {
      type: actionTypes.DISCONNECT_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(getState(reducer(state, action))).toEqual({
      isConnected: true,
      disconnectRequest: {inProgress: false, error: new Error('AH')}
    })
  })
})
