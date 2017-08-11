// robot reducer test

import {reducer, actionTypes} from '../'

describe('robot reducer', () => {
  test('initial state', () => {
    const state = reducer(undefined, {})

    expect(state).toEqual({
      isConnected: {value: false, requestInProgress: true, error: null},
      isHomed: {value: false, requestInProgress: false, error: null},
      isRunning: {value: false, requestInProgress: false, error: null}
    })
  })

  test('handles connect response success', () => {
    const state = {isConnected: {value: false, requestInProgress: true, error: null}}
    const action = {type: actionTypes.CONNECT_RESPONSE, error: null}

    expect(reducer(state, action)).toEqual({
      isConnected: {value: true, requestInProgress: false, error: null}
    })
  })

  test('handles connect response error', () => {
    const state = {isConnected: {value: false, requestInProgress: true, error: null}}
    const action = {type: actionTypes.CONNECT_RESPONSE, error: new Error('AH')}

    expect(reducer(state, action)).toEqual({
      isConnected: {value: false, requestInProgress: false, error: new Error('AH')}
    })
  })

  // TODO(mc): we may need to track which specific axes are homing
  test('handles home action', () => {
    const state = {isHomed: {value: false, requestInProgress: false, error: 'AHH'}}
    const action = {type: actionTypes.HOME}

    expect(reducer(state, action)).toEqual({
      isHomed: {value: false, requestInProgress: true, error: null}
    })
  })

  test('handles homeResponse success', () => {
    const state = {isHomed: {value: false, requestInProgress: true, error: null}}
    const action = {type: actionTypes.HOME_RESPONSE, error: null}

    expect(reducer(state, action)).toEqual({
      isHomed: {value: true, requestInProgress: false, error: null}
    })
  })

  test('handles homeResponse failure', () => {
    const state = {isHomed: {value: false, requestInProgress: true, error: null}}
    const action = {type: actionTypes.HOME_RESPONSE, error: new Error('AH')}

    expect(reducer(state, action)).toEqual({
      isHomed: {value: false, requestInProgress: false, error: new Error('AH')}
    })
  })

  test('handles run action', () => {
    const state = {isRunning: {value: false, requestInProgress: false, error: 'AHH'}}
    const action = {type: actionTypes.RUN}

    expect(reducer(state, action)).toEqual({
      isRunning: {value: false, requestInProgress: true, error: null}
    })
  })

  test('handles runResponse success', () => {
    const state = {isRunning: {value: false, requestInProgress: true, error: null}}
    const action = {type: actionTypes.RUN_RESPONSE, error: null}

    expect(reducer(state, action)).toEqual({
      isRunning: {value: true, requestInProgress: false, error: null}
    })
  })

  test('handles runResponse failure', () => {
    const state = {isRunning: {value: false, requestInProgress: true, error: null}}
    const action = {type: actionTypes.RUN_RESPONSE, error: new Error('AH')}

    expect(reducer(state, action)).toEqual({
      isRunning: {value: false, requestInProgress: false, error: new Error('AH')}
    })
  })
})
