// interface selectors test

import {NAME, selectors} from '../'

describe('user interface selectors', () => {
  test('get is panel open', () => {
    let state = {[NAME]: {isPanelClosed: true}}
    expect(selectors.getIsPanelClosed(state)).toBe(true)

    state = {[NAME]: {isPanelClosed: false}}
    expect(selectors.getIsPanelClosed(state)).toBe(false)
  })

  test('get active panel', () => {
    const state = {[NAME]: {currentPanel: 'upload'}}

    expect(selectors.getCurrentPanel(state)).toBe('upload')
  })
})
