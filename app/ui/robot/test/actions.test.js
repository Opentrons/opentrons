// robot actions tests

import {actions, actionTypes} from '../'

describe('robot effects', () => {
  test('connect action', () => {
    const expected = {
      type: actionTypes.CONNECT,
      meta: {robotCommand: true}
    }

    expect(actions.connect()).toEqual(expected)
  })

  test('connect response action', () => {
    const expected = {
      type: actionTypes.CONNECT_RESPONSE,
      error: new Error('AHHH')
    }

    expect(actions.connectResponse(new Error('AHHH'))).toEqual(expected)
  })

  test('load protocol action', () => {
    const expected = {
      type: actionTypes.LOAD_PROTOCOL
    }

    expect(actions.loadProtocol()).toEqual(expected)
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

describe('robot actions', () => {
  test('set isConnected', () => {
    const expected = {
      type: actionTypes.SET_IS_CONNECTED,
      payload: {isConnected: false}
    }

    expect(actions.setIsConnected(false)).toEqual(expected)
  })

  test('set commands', () => {
    const expected = {
      type: actionTypes.SET_COMMANDS,
      payload: {commands: ['foo', 'bar', 'baz']}
    }

    expect(actions.setCommands(['foo', 'bar', 'baz'])).toEqual(expected)
  })

  test('set protocol error', () => {
    const expected = {
      type: actionTypes.SET_PROTOCOL_ERROR,
      error: new Error('AHHH')
    }

    expect(actions.setProtocolError(new Error('AHHH'))).toEqual(expected)
  })

  test('tick current command counter', () => {
    const expected = {type: actionTypes.TICK_CURRENT_COMMAND}

    expect(actions.tickCurrentCommand()).toEqual(expected)
  })
})
