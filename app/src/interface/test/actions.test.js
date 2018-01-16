// interface actions test

import {actions, actionTypes} from '../'

describe('interface actions', () => {
  test('close nav panel', () => {
    const expected = {type: actionTypes.CLOSE_PANEL}

    expect(actions.closePanel()).toEqual(expected)
  })

  test('set current nav panel', () => {
    const expected = {type: actionTypes.SET_CURRENT_PANEL, payload: {panel: 'upload'}}

    expect(actions.setCurrentPanel('upload')).toEqual(expected)
  })
})
