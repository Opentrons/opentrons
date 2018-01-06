// interface selectors test

import {NAME, selectors} from '../'

describe('user interface selectors', () => {
  test('get is panel open', () => {
    let state = {[NAME]: {isPanelOpen: true}}
    expect(selectors.getIsPanelOpen(state)).toBe(true)

    state = {[NAME]: {isPanelOpen: false}}
    expect(selectors.getIsPanelOpen(state)).toBe(false)
  })

  test('get active panel', () => {
    const state = {[NAME]: {currentPanel: 'upload'}}

    expect(selectors.getCurrentPanel(state)).toBe('upload')
  })
})
