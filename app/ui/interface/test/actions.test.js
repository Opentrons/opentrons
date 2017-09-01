// interface actions test

import {actions, actionTypes} from '../'

describe('interface actions', () => {
  test('toggle nav panel', () => {
    const expected = {type: actionTypes.TOGGLE_NAV_PANEL}

    expect(actions.toggleNavPanel()).toEqual(expected)
  })
})
