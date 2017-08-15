// robot reducer test

import {reducer, actionTypes} from '../'

describe('robot reducer', () => {
  test('initial state', () => {
    const state = reducer(undefined, {})

    expect(state).toEqual({
      home: {requestInProgress: false, error: null},
      run: {requestInProgress: false, error: null}
    })
  })

  // TODO(mc): we may need to track which specific axes are homing
  test('handles home action', () => {
    const action = {type: actionTypes.HOME}
    const state = {home: {requestInProgress: false, error: null}}

    expect(reducer(state, action)).toEqual({
      home: {requestInProgress: true, error: null}
    })
  })

  test('handles homeResponse action', () => {
    const action = {type: actionTypes.HOME_RESPONSE, error: new Error('AH')}
    const state = {home: {requestInProgress: true, error: null}}

    expect(reducer(state, action)).toEqual({
      home: {requestInProgress: false, error: new Error('AH')}
    })
  })

  test('handles run action', () => {
    const action = {type: actionTypes.RUN}
    const state = {run: {requestInProgress: false, error: null}}

    expect(reducer(state, action)).toEqual({
      run: {requestInProgress: true, error: null}
    })
  })

  test('handles runResponse action', () => {
    const action = {type: actionTypes.RUN_RESPONSE, error: new Error('AH')}
    const state = {run: {requestInProgress: true, error: null}}

    expect(reducer(state, action)).toEqual({
      run: {requestInProgress: false, error: new Error('AH')}
    })
  })
})
