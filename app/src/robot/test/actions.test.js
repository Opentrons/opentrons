// robot actions tests
import {actions, actionTypes} from '../'

describe('robot actions', () => {
  test('DISCOVER action', () => {
    const expected = {
      type: 'robot:DISCOVER',
      meta: {robotCommand: true}
    }

    expect(actions.discover()).toEqual(expected)
  })

  test('DISCOVER_FINISH action', () => {
    const expected = {
      type: 'robot:DISCOVER_FINISH'
    }

    expect(actions.discoverFinish()).toEqual(expected)
  })

  test('ADD_DISCOVERED action', () => {
    const name = 'Opentrons XYZ123'
    const host = '123456.local'
    const expected = {
      type: 'robot:ADD_DISCOVERED',
      payload: {host, name}
    }

    expect(actions.addDiscovered({host, name})).toEqual(expected)
  })

  test('REMOVE_DISCOVERED action', () => {
    const service = {name: 'ot'}
    const expected = {
      type: 'robot:REMOVE_DISCOVERED',
      payload: service
    }

    expect(actions.removeDiscovered(service)).toEqual(expected)
  })

  test('CONNECT action', () => {
    const expected = {
      type: 'robot:CONNECT',
      payload: {name: 'ot'},
      meta: {robotCommand: true}
    }

    expect(actions.connect('ot')).toEqual(expected)
  })

  test('CONNECT_RESPONSE action', () => {
    const success = {
      type: 'robot:CONNECT_RESPONSE',
      payload: {},
      meta: {analytics: true}
    }
    const failure = {
      type: 'robot:CONNECT_RESPONSE',
      payload: {error: new Error('AH')},
      meta: {analytics: true}
    }

    expect(actions.connectResponse()).toEqual(success)
    expect(actions.connectResponse(new Error('AH'))).toEqual(failure)
  })

  test('CLEAR_CONNECT_RESPONSE action', () => {
    const expected = {type: 'robot:CLEAR_CONNECT_RESPONSE'}

    expect(actions.clearConnectResponse()).toEqual(expected)
  })

  test('DISCONNECT action', () => {
    const expected = {
      type: 'robot:DISCONNECT',
      meta: {robotCommand: true}
    }

    expect(actions.disconnect()).toEqual(expected)
  })

  test('DISCONNECT_RESPONSE action', () => {
    const success = {
      type: 'robot:DISCONNECT_RESPONSE',
      payload: {}
    }

    expect(actions.disconnectResponse()).toEqual(success)
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

  test('SESSION_UPDATE action', () => {
    const update = {state: 'running', startTime: 1}
    const expected = {type: 'robot:SESSION_UPDATE', payload: update}

    expect(actions.sessionUpdate(update)).toEqual(expected)
  })

  test('set deck populated action', () => {
    expect(actions.setDeckPopulated(false)).toEqual({
      type: actionTypes.SET_DECK_POPULATED,
      payload: false
    })

    expect(actions.setDeckPopulated(true)).toEqual({
      type: actionTypes.SET_DECK_POPULATED,
      payload: true
    })
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

  test('PICKUP_AND_HOME action', () => {
    const action = {
      type: 'robot:PICKUP_AND_HOME',
      payload: {mount: 'left', slot: '5'},
      meta: {robotCommand: true}
    }

    expect(actions.pickupAndHome('left', '5')).toEqual(action)
  })

  test('PICKUP_AND_HOME response actions', () => {
    const success = {
      type: 'robot:PICKUP_AND_HOME_SUCCESS',
      payload: {}
    }
    const failure = {
      type: 'robot:PICKUP_AND_HOME_FAILURE',
      error: true,
      payload: new Error('AH')
    }

    expect(actions.pickupAndHomeResponse()).toEqual(success)
    expect(actions.pickupAndHomeResponse(new Error('AH'))).toEqual(failure)
  })

  test('DROP_TIP_AND_HOME action', () => {
    const action = {
      type: 'robot:DROP_TIP_AND_HOME',
      payload: {mount: 'right', slot: '5'},
      meta: {robotCommand: true}
    }

    expect(actions.dropTipAndHome('right', '5')).toEqual(action)
  })

  test('DROP_TIP_AND_HOME response actions', () => {
    const success = {
      type: 'robot:DROP_TIP_AND_HOME_SUCCESS',
      payload: {}
    }

    const failure = {
      type: 'robot:DROP_TIP_AND_HOME_FAILURE',
      error: true,
      payload: new Error('AH')
    }

    expect(actions.dropTipAndHomeResponse()).toEqual(success)
    expect(actions.dropTipAndHomeResponse(new Error('AH'))).toEqual(failure)
  })

  test('CONFIRM_TIPRACK action', () => {
    const action = {
      type: 'robot:CONFIRM_TIPRACK',
      payload: {mount: 'left', slot: '9'},
      meta: {robotCommand: true}
    }

    expect(actions.confirmTiprack('left', '9')).toEqual(action)
  })

  test('CONFIRM_TIPRACK response actions', () => {
    const success = {
      type: 'robot:CONFIRM_TIPRACK_SUCCESS',
      payload: {tipOn: true}
    }

    const failure = {
      type: 'robot:CONFIRM_TIPRACK_FAILURE',
      error: true,
      payload: new Error('AH')
    }

    expect(actions.confirmTiprackResponse(null, true)).toEqual(success)
    expect(actions.confirmTiprackResponse(new Error('AH'))).toEqual(failure)
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

  test('CONFIRM_PROBED action', () => {
    const expected = {
      type: 'robot:CONFIRM_PROBED',
      payload: 'left'
    }

    expect(actions.confirmProbed('left')).toEqual(expected)
  })

  test('MOVE_TO action', () => {
    const expected = {
      type: 'robot:MOVE_TO',
      payload: {mount: 'left', slot: '3'},
      meta: {robotCommand: true}
    }

    expect(actions.moveTo('left', '3')).toEqual(expected)
  })

  test('MOVE_TO response actions', () => {
    const success = {
      type: 'robot:MOVE_TO_SUCCESS',
      payload: {}
    }
    const failure = {
      type: 'robot:MOVE_TO_FAILURE',
      error: true,
      payload: new Error('AH')
    }

    expect(actions.moveToResponse()).toEqual(success)
    expect(actions.moveToResponse(new Error('AH'))).toEqual(failure)
  })

  test('set jog distance action', () => {
    const expected = {type: 'robot:SET_JOG_DISTANCE', payload: 10}
    expect(actions.setJogDistance(10)).toEqual(expected)
  })

  test('JOG action', () => {
    const expected = {
      type: 'robot:JOG',
      payload: {mount: 'left', axis: 'x', direction: -1},
      meta: {robotCommand: true}
    }

    expect(actions.jog('left', 'x', -1)).toEqual(expected)
  })

  test('jog response action', () => {
    const success = {
      type: 'robot:JOG_SUCCESS',
      payload: {}
    }
    const failure = {
      type: 'robot:JOG_FAILURE',
      error: true,
      payload: new Error('AH')
    }

    expect(actions.jogResponse()).toEqual(success)
    expect(actions.jogResponse(new Error('AH'))).toEqual(failure)
  })

  test('UPDATE_OFFSET action', () => {
    const expected = {
      type: 'robot:UPDATE_OFFSET',
      payload: {mount: 'left', slot: '2'},
      meta: {robotCommand: true}
    }

    expect(actions.updateOffset('left', '2')).toEqual(expected)
  })

  test('UPDATE_OFFSET response actions', () => {
    const success = {
      type: 'robot:UPDATE_OFFSET_SUCCESS',
      payload: {}
    }
    const failure = {
      type: 'robot:UPDATE_OFFSET_FAILURE',
      error: true,
      payload: new Error('AH')
    }

    expect(actions.updateOffsetResponse()).toEqual(success)
    expect(actions.updateOffsetResponse(new Error('AH'))).toEqual(failure)
  })

  test('confirm labware action', () => {
    const expected = {
      type: actionTypes.CONFIRM_LABWARE,
      payload: {labware: '2'}
    }

    expect(actions.confirmLabware('2')).toEqual(expected)
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
