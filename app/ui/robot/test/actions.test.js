// robot actions tests

import {actions, actionTypes} from '../'

describe('robot actions', () => {
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

  test('disconnect action', () => {
    const expected = {
      type: actionTypes.DISCONNECT,
      meta: {robotCommand: true}
    }

    expect(actions.disconnect()).toEqual(expected)
  })

  test('disconnect response action', () => {
    const expected = {
      type: actionTypes.DISCONNECT_RESPONSE,
      error: new Error('AHHH')
    }

    expect(actions.disconnectResponse(new Error('AHHH'))).toEqual(expected)
  })

  test('session action', () => {
    const file = {name: '/foo/bar/baz.py'}
    const expected = {
      type: actionTypes.SESSION,
      payload: {file},
      meta: {robotCommand: true}
    }

    expect(actions.session(file)).toEqual(expected)
  })

  test('session response', () => {
    const error = new Error('AH')
    const session = {name: 'session-name'}
    const expected = {
      type: actionTypes.SESSION_RESPONSE,
      payload: {session},
      error
    }

    expect(actions.sessionResponse(error, session)).toEqual(expected)
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

  test('pause action', () => {
    const expected = {
      type: actionTypes.PAUSE,
      meta: {robotCommand: true}
    }

    expect(actions.pause()).toEqual(expected)
  })

  test('pause response action', () => {
    const expected = {
      type: actionTypes.PAUSE_RESPONSE,
      error: new Error('AHHH')
    }

    expect(actions.pauseResponse(new Error('AHHH'))).toEqual(expected)
  })

  test('resume action', () => {
    const expected = {
      type: actionTypes.RESUME,
      meta: {robotCommand: true}
    }

    expect(actions.resume()).toEqual(expected)
  })

  test('resume response action', () => {
    const expected = {
      type: actionTypes.RESUME_RESPONSE,
      error: new Error('AHHH')
    }

    expect(actions.resumeResponse(new Error('AHHH'))).toEqual(expected)
  })

  test('cancel action', () => {
    const expected = {
      type: actionTypes.CANCEL,
      meta: {robotCommand: true}
    }

    expect(actions.cancel()).toEqual(expected)
  })

  test('cancel response action', () => {
    const expected = {
      type: actionTypes.CANCEL_RESPONSE,
      error: new Error('AHHH')
    }

    expect(actions.cancelResponse(new Error('AHHH'))).toEqual(expected)
  })

  test('tick run time action', () => {
    const expected = {type: actionTypes.TICK_RUN_TIME}

    expect(actions.tickRunTime()).toEqual(expected)
  })
})
