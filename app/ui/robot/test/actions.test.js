// robot actions tests

import {actions, actionTypes} from '../'

describe('robot actions', () => {
  test('CONNECT action', () => {
    const expected = {
      type: actionTypes.CONNECT,
      meta: {robotCommand: true}
    }

    expect(actions.connect()).toEqual(expected)
  })

  test('CONNECT_RESPONSE action', () => {
    const success = {
      type: actionTypes.CONNECT_RESPONSE,
      error: false
    }
    const failure = {
      type: actionTypes.CONNECT_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(actions.connectResponse()).toEqual(success)
    expect(actions.connectResponse(new Error('AH'))).toEqual(failure)
  })

  test('DISCONNECT action', () => {
    const expected = {
      type: actionTypes.DISCONNECT,
      meta: {robotCommand: true}
    }

    expect(actions.disconnect()).toEqual(expected)
  })

  test('DISCONNECT_RESPONSE action', () => {
    const success = {
      type: actionTypes.DISCONNECT_RESPONSE,
      error: false
    }
    const failure = {
      type: actionTypes.DISCONNECT_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(actions.disconnectResponse()).toEqual(success)
    expect(actions.disconnectResponse(new Error('AH'))).toEqual(failure)
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
    const session = {state: 'READY'}
    const error = new Error('AH')

    const success = {
      type: actionTypes.SESSION_RESPONSE,
      payload: session,
      error: false
    }
    const failure = {
      type: actionTypes.SESSION_RESPONSE,
      payload: error,
      error: true
    }

    expect(actions.sessionResponse(null, session)).toEqual(success)
    expect(actions.sessionResponse(error)).toEqual(failure)
  })

  test('set labware reviewed action', () => {
    const expected = {
      type: actionTypes.SET_LABWARE_REVIEWED,
      payload: false
    }

    expect(actions.setLabwareReviewed(false)).toEqual(expected)
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
      payload: {instrument: 'left', axis: 'x', direction: -1},
      meta: {robotCommand: true}
    }

    expect(actions.jog('left', 'x', -1)).toEqual(expected)
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

  test('confirm labware action', () => {
    const expected = {
      type: actionTypes.CONFIRM_LABWARE,
      payload: {labware: 2}
    }

    expect(actions.confirmLabware(2)).toEqual(expected)
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
      payload: {instrument: 'left', axis: 'x', direction: -1},
      meta: {robotCommand: true}
    }

    expect(actions.jog('left', 'x', -1)).toEqual(expected)
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
    const success = {type: actionTypes.RUN_RESPONSE, error: false}
    const failure = {
      type: actionTypes.RUN_RESPONSE,
      payload: new Error('AH'),
      error: true
    }

    expect(actions.runResponse()).toEqual(success)
    expect(actions.runResponse(new Error('AH'))).toEqual(failure)
  })

  test('pause action', () => {
    const expected = {
      type: actionTypes.PAUSE,
      meta: {robotCommand: true}
    }

    expect(actions.pause()).toEqual(expected)
  })

  test('pause response action', () => {
    const success = {type: actionTypes.PAUSE_RESPONSE, error: false}
    const failure = {
      type: actionTypes.PAUSE_RESPONSE,
      payload: new Error('AH'),
      error: true
    }

    expect(actions.pauseResponse()).toEqual(success)
    expect(actions.pauseResponse(new Error('AH'))).toEqual(failure)
  })

  test('resume action', () => {
    const expected = {
      type: actionTypes.RESUME,
      meta: {robotCommand: true}
    }

    expect(actions.resume()).toEqual(expected)
  })

  test('resume response action', () => {
    const success = {type: actionTypes.RESUME_RESPONSE, error: false}
    const failure = {
      type: actionTypes.RESUME_RESPONSE,
      payload: new Error('AHHH'),
      error: true
    }

    expect(actions.resumeResponse()).toEqual(success)
    expect(actions.resumeResponse(new Error('AHHH'))).toEqual(failure)
  })

  test('cancel action', () => {
    const expected = {
      type: actionTypes.CANCEL,
      meta: {robotCommand: true}
    }

    expect(actions.cancel()).toEqual(expected)
  })

  test('cancel response action', () => {
    const success = {type: actionTypes.CANCEL_RESPONSE, error: false}
    const failure = {
      type: actionTypes.CANCEL_RESPONSE,
      payload: new Error('AHHH'),
      error: true
    }

    expect(actions.cancelResponse()).toEqual(success)
    expect(actions.cancelResponse(new Error('AHHH'))).toEqual(failure)
  })

  test('tick run time action', () => {
    const expected = {type: actionTypes.TICK_RUN_TIME}

    expect(actions.tickRunTime()).toEqual(expected)
  })
})
