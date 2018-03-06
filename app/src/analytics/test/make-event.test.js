// events map tests
import makeEvent from '../make-event'

import {actions as robotActions} from '../../robot'

describe('analytics events map', () => {
  test('CONNECT_RESPONSE -> connect : robot', () => {
    const state = {}
    const action = robotActions.connectResponse()

    expect(makeEvent(state, action)).toEqual({
      name: 'connect',
      category: 'robot',
      payload: {}
    })
  })
})
