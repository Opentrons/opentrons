// robot actions tests

import {actions, actionTypes} from '../'

describe('robot requests and responses', () => {
  test('connect action', () => {
    const expected = {
      type: actionTypes.CONNECT,
      meta: {robotCommand: true}
    }

    expect(actions.connect()).toEqual(expected)
  })

  test('home action without axes', () => {
    const expected = {
      type: actionTypes.HOME,
      meta: {robotCommand: true}
    }

    expect(actions.home()).toEqual(expected)
  })

  test('home action with axes', () => {
    const expected = {
      type: actionTypes.HOME,
      payload: {axes: 'xy'},
      meta: {robotCommand: true}
    }

    expect(actions.home('xy')).toEqual(expected)
  })

  test('home response action', () => {
    const expected = {
      type: actionTypes.HOME_RESPONSE,
      error: new Error('AHHH')
    }

    expect(actions.homeResponse(new Error('AHHH'))).toEqual(expected)
  })

  test('run action', () => {
    const expected = {
      type: actionTypes.RUN,
      meta: {robotCommand: true}
    }

    expect(actions.run()).toEqual(expected)
  })

  test('run response action', () => {
    const expected = {
      type: actionTypes.RUN_RESPONSE,
      error: new Error('AHHH')
    }

    expect(actions.runResponse(new Error('AHHH'))).toEqual(expected)
  })
})

describe('robot state', () => {
  test('set isConnected', () => {
    const expected = {
      type: actionTypes.SET_IS_CONNECTED,
      payload: {isConnected: false}
    }

    expect(actions.setIsConnected(false)).toEqual(expected)
  })
})
