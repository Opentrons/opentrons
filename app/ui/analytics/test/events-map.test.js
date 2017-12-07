// events map tests
import eventsMap from '../events-map'

import {actions as robotActions} from '../../robot'

describe('analytics events map', () => {
  test('CONNECT_RESPONSE -> connect : robot', () => {
    const state = {}
    const action = robotActions.connectResponse()
    const mapper = eventsMap[action.type]

    expect(mapper).toEqual(expect.any(Function))
    expect(mapper(state, action)).toEqual({
      name: 'connect',
      category: 'robot',
      payload: {}
    })
  })
})
