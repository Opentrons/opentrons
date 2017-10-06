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
    // TODO(mc, 2017-10-02): In FSA, action.error is bool, payload is an Error
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
    // TODO(mc, 2017-10-02): In FSA, action.error is bool, payload is an Error
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
    // TODO(mc, 2017-10-02): In FSA, action.error is bool, payload is an Error
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
    // TODO(mc, 2017-10-02): In FSA, action.error is bool, payload is an Error
    const expected = {
      type: actionTypes.HOME_RESPONSE,
      error: new Error('AHHH')
    }

    expect(actions.homeResponse(new Error('AHHH'))).toEqual(expected)
  })

  test('set current instrument', () => {
    const expected = {
      type: actionTypes.SET_CURRENT_INSTRUMENT,
      payload: {instrument: 'right'}
    }

    expect(actions.setCurrentInstrument('right')).toEqual(expected)
  })

  test('set current labware', () => {
    const expected = {
      type: actionTypes.SET_CURRENT_LABWARE,
      payload: {labware: 2}
    }

    expect(actions.setCurrentLabware(2)).toEqual(expected)
  })

  test('move tip to front action', () => {
    const expected = {
      type: actionTypes.MOVE_TO_FRONT,
      payload: {instrument: 'right'},
      meta: {robotCommand: true}
    }

    expect(actions.moveToFront('right')).toEqual(expected)
  })

  test('move tip to front response action', () => {
    const success = {
      type: actionTypes.MOVE_TO_FRONT_RESPONSE,
      error: false
    }
    const failure = {
      type: actionTypes.MOVE_TO_FRONT_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(actions.moveToFrontResponse()).toEqual(success)
    expect(actions.moveToFrontResponse(new Error('AH'))).toEqual(failure)
  })

  test('probe tip action', () => {
    const expected = {
      type: actionTypes.PROBE_TIP,
      payload: {instrument: 'left'},
      meta: {robotCommand: true}
    }

    expect(actions.probeTip('left')).toEqual(expected)
  })

  test('probe tip response action', () => {
    const success = {
      type: actionTypes.PROBE_TIP_RESPONSE,
      error: false
    }
    const failure = {
      type: actionTypes.PROBE_TIP_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(actions.probeTipResponse()).toEqual(success)
    expect(actions.probeTipResponse(new Error('AH'))).toEqual(failure)
  })

  test('move to action', () => {
    const expected = {
      type: actionTypes.MOVE_TO,
      payload: {instrument: 'left', labware: 3},
      meta: {robotCommand: true}
    }

    expect(actions.moveTo('left', 3)).toEqual(expected)
  })

  test('move to response action', () => {
    const success = {
      type: actionTypes.MOVE_TO_RESPONSE,
      error: false
    }
    const failure = {
      type: actionTypes.MOVE_TO_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(actions.moveToResponse()).toEqual(success)
    expect(actions.moveToResponse(new Error('AH'))).toEqual(failure)
  })

  test('jog action', () => {
    const expected = {
      type: actionTypes.JOG,
      payload: {instrument: 'left', coordinates: {x: 3}},
      meta: {robotCommand: true}
    }

    expect(actions.jog('left', {x: 3})).toEqual(expected)
  })

  test('jog response action', () => {
    const success = {
      type: actionTypes.JOG_RESPONSE,
      error: false
    }
    const failure = {
      type: actionTypes.JOG_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(actions.jogResponse()).toEqual(success)
    expect(actions.jogResponse(new Error('AH'))).toEqual(failure)
  })

  test('update offset action', () => {
    const expected = {
      type: actionTypes.UPDATE_OFFSET,
      payload: {instrument: 'left', labware: 2},
      meta: {robotCommand: true}
    }

    expect(actions.updateOffset('left', 2)).toEqual(expected)
  })

  test('update offset response action', () => {
    const success = {
      type: actionTypes.UPDATE_OFFSET_RESPONSE,
      error: false
    }
    const failure = {
      type: actionTypes.UPDATE_OFFSET_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(actions.updateOffsetResponse()).toEqual(success)
    expect(actions.updateOffsetResponse(new Error('AH'))).toEqual(failure)
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
