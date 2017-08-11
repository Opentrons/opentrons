// robot actions tests

import {actions, actionTypes} from '../'

describe('robot actions', () => {
  test('connection response', () => {
    const expected = {
      type: actionTypes.CONNECT_RESPONSE,
      error: new Error('AHHH')
    }

    expect(actions.connectResponse(new Error('AHHH'))).toEqual(expected)
  })

  test('home action', () => {
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
