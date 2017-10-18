// interface reducer test

import {reducer, actionTypes} from '../'

describe('interface reducer', () => {
  test('initial state', () => {
    const state = reducer(undefined, {})

    expect(state).toEqual({
      isNavPanelOpen: false,
      currentNavPanelTask: ''
    })
  })

  test('handles toggleNavPanel', () => {
    const action = {type: actionTypes.TOGGLE_NAV_PANEL}

    let state = {isNavPanelOpen: false}
    expect(reducer(state, action)).toEqual({isNavPanelOpen: true})

    state = {isNavPanelOpen: true}
    expect(reducer(state, action)).toEqual({isNavPanelOpen: false})
  })

  test('handles setCurrentNavPanel with nav panel closed', () => {
    const state = {currentNavPanelTask: 'upload', isNavPanelOpen: false}
    const panel = 'connect'
    const action = {type: actionTypes.SET_CURRENT_NAV_PANEL, payload: {panel}}

    expect(reducer(state, action)).toEqual({
      currentNavPanelTask: 'connect',
      isNavPanelOpen: true
    })
  })

  test('handles setCurrentNavPanel with nav panel open', () => {
    const state = {currentNavPanelTask: 'upload', isNavPanelOpen: true}
    const panel = 'upload'
    const action = {type: actionTypes.SET_CURRENT_NAV_PANEL, payload: {panel}}

    expect(reducer(state, action)).toEqual({
      currentNavPanelTask: 'upload',
      isNavPanelOpen: false
    })
  })
})
