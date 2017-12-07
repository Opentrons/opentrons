// interface reducer test

import {reducer, actionTypes} from '../'

describe('interface reducer', () => {
  test('initial state', () => {
    const state = reducer(undefined, {})

    expect(state).toEqual({
      isPanelOpen: false,
      currentPanel: 'connect'
    })
  })

  test('handles closePanel', () => {
    const state = {isPanelOpen: true, currentPanel: 'upload'}
    const action = {type: actionTypes.CLOSE_PANEL}

    expect(reducer(state, action)).toEqual({
      isPanelOpen: false,
      currentPanel: 'upload'
    })
  })

  test('handles setCurrentPanel', () => {
    const state = {isPanelOpen: false, currentPanel: 'upload'}
    const action = {
      type: actionTypes.SET_CURRENT_PANEL,
      payload: {panel: 'connect'}
    }

    expect(reducer(state, action)).toEqual({
      isPanelOpen: true,
      currentPanel: 'connect'
    })
  })
})
