// interface reducer test

import {reducer, actionTypes} from '../'

describe('interface reducer', () => {
  test('initial state', () => {
    const state = reducer(undefined, {})

    expect(state).toEqual({
      isPanelClosed: false,
      currentPanel: 'connect'
    })
  })

  test('handles closePanel', () => {
    const state = {isPanelClosed: false, currentPanel: 'upload'}
    const action = {type: actionTypes.CLOSE_PANEL}

    expect(reducer(state, action)).toEqual({
      isPanelClosed: true,
      currentPanel: 'upload'
    })
  })

  test('handles setCurrentPanel', () => {
    const state = {isPanelClosed: true, currentPanel: 'upload'}
    const action = {
      type: actionTypes.SET_CURRENT_PANEL,
      payload: {panel: 'connect'}
    }

    expect(reducer(state, action)).toEqual({
      isPanelClosed: false,
      currentPanel: 'connect'
    })
  })

  test('handles robot:DISCONNECT_RESPONSE', () => {
    const state = {isPanelClosed: true, currentPanel: 'upload'}
    const action = {type: 'robot:DISCONNECT_RESPONSE', payload: {}}

    expect(reducer(state, action)).toEqual({
      isPanelClosed: true,
      currentPanel: 'connect'
    })
  })
})
