// interface reducer test

import {reducer, actionTypes} from '../'

describe('interface reducer', () => {
  test('initial state', () => {
    const state = reducer(undefined, {})

    expect(state).toEqual({
      isNavPanelOpen: false,
      currentNavPanelTask: 'connect'
    })
  })

  test('handles toggleNavPanel', () => {
    const action = {type: actionTypes.TOGGLE_NAV_PANEL}

    let state = {isNavPanelOpen: false}
    expect(reducer(state, action)).toEqual({isNavPanelOpen: true})

    state = {isNavPanelOpen: true}
    expect(reducer(state, action)).toEqual({isNavPanelOpen: false})
  })

  test('handles setCurrentNavPanel', () => {
    let panel = 'connect'

    const action = {type: actionTypes.SET_CURRENT_NAV_PANEL, payload: {panel}}

    let state = {currentNavPanelTask: 'upload'}
    expect(reducer(state, action)).toEqual({currentNavPanelTask: 'connect', isNavPanelOpen: true})
  })
})
