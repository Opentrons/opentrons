// robot actions tests
import { actions, actionTypes } from '../'

describe('robot actions', () => {
  it('CONNECT action', () => {
    const expected = {
      type: 'robot:CONNECT',
      payload: { name: 'ot' },
      meta: { robotCommand: true },
    }

    expect(actions.connect('ot')).toEqual(expected)
  })

  it('CONNECT_RESPONSE action', () => {
    const success = {
      type: 'robot:CONNECT_RESPONSE',
      payload: { error: null, sessionCapabilities: ['create'] },
    }
    const failure = {
      type: 'robot:CONNECT_RESPONSE',
      payload: { error: new Error('AH'), sessionCapabilities: [] },
    }

    expect(actions.connectResponse(null, ['create'])).toEqual(success)
    expect(actions.connectResponse(new Error('AH'))).toEqual(failure)
  })

  it('CLEAR_CONNECT_RESPONSE action', () => {
    const expected = { type: 'robot:CLEAR_CONNECT_RESPONSE' }

    expect(actions.clearConnectResponse()).toEqual(expected)
  })

  it('DISCONNECT action', () => {
    const expected = {
      type: 'robot:DISCONNECT',
      meta: { robotCommand: true },
    }

    expect(actions.disconnect()).toEqual(expected)
  })

  it('DISCONNECT_RESPONSE action', () => {
    const success = {
      type: 'robot:DISCONNECT_RESPONSE',
      payload: {},
    }

    expect(actions.disconnectResponse()).toEqual(success)
  })

  it('session response', () => {
    const session = { state: 'READY' }
    const error = new Error('AH')

    const success = {
      type: 'robot:SESSION_RESPONSE',
      payload: session,
      meta: { freshUpload: true },
    }
    const failure = {
      type: 'robot:SESSION_ERROR',
      payload: { error },
      meta: { freshUpload: false },
    }

    expect(actions.sessionResponse(null, session, true)).toEqual(success)
    expect(actions.sessionResponse(error, null, false)).toEqual(failure)
  })

  it('SESSION_UPDATE action', () => {
    const update = { state: 'running', startTime: 1 }
    const expected = {
      type: 'robot:SESSION_UPDATE',
      payload: update,
      meta: { now: 1234 },
    }

    expect(actions.sessionUpdate(update, 1234)).toEqual(expected)
  })

  it('set modules reviewed action', () => {
    expect(actions.setModulesReviewed(false)).toEqual({
      type: 'robot:SET_MODULES_REVIEWED',
      payload: false,
    })

    expect(actions.setModulesReviewed(true)).toEqual({
      type: 'robot:SET_MODULES_REVIEWED',
      payload: true,
    })
  })

  it('set deck populated action', () => {
    expect(actions.setDeckPopulated(false)).toEqual({
      type: actionTypes.SET_DECK_POPULATED,
      payload: false,
    })

    expect(actions.setDeckPopulated(true)).toEqual({
      type: actionTypes.SET_DECK_POPULATED,
      payload: true,
    })
  })

  it('move tip to front action', () => {
    const expected = {
      type: actionTypes.MOVE_TO_FRONT,
      payload: { mount: 'right' },
      meta: { robotCommand: true },
    }

    expect(actions.moveToFront('right')).toEqual(expected)
  })

  it('move tip to front response action', () => {
    const success = {
      type: actionTypes.MOVE_TO_FRONT_RESPONSE,
      error: false,
    }
    const failure = {
      type: actionTypes.MOVE_TO_FRONT_RESPONSE,
      error: true,
      payload: new Error('AH'),
    }

    expect(actions.moveToFrontResponse()).toEqual(success)
    expect(actions.moveToFrontResponse(new Error('AH'))).toEqual(failure)
  })

  it('PICKUP_AND_HOME action', () => {
    const action = {
      type: 'robot:PICKUP_AND_HOME',
      payload: { mount: 'left', slot: '5' },
      meta: { robotCommand: true },
    }

    expect(actions.pickupAndHome('left', '5')).toEqual(action)
  })

  it('PICKUP_AND_HOME response actions', () => {
    const success = {
      type: 'robot:PICKUP_AND_HOME_SUCCESS',
      payload: {},
    }
    const failure = {
      type: 'robot:PICKUP_AND_HOME_FAILURE',
      error: true,
      payload: new Error('AH'),
    }

    expect(actions.pickupAndHomeResponse()).toEqual(success)
    expect(actions.pickupAndHomeResponse(new Error('AH'))).toEqual(failure)
  })

  it('DROP_TIP_AND_HOME action', () => {
    const action = {
      type: 'robot:DROP_TIP_AND_HOME',
      payload: { mount: 'right', slot: '5' },
      meta: { robotCommand: true },
    }

    expect(actions.dropTipAndHome('right', '5')).toEqual(action)
  })

  it('DROP_TIP_AND_HOME response actions', () => {
    const success = {
      type: 'robot:DROP_TIP_AND_HOME_SUCCESS',
      payload: {},
    }

    const failure = {
      type: 'robot:DROP_TIP_AND_HOME_FAILURE',
      error: true,
      payload: new Error('AH'),
    }

    expect(actions.dropTipAndHomeResponse()).toEqual(success)
    expect(actions.dropTipAndHomeResponse(new Error('AH'))).toEqual(failure)
  })

  it('CONFIRM_TIPRACK action', () => {
    const action = {
      type: 'robot:CONFIRM_TIPRACK',
      payload: { mount: 'left', slot: '9' },
      meta: { robotCommand: true },
    }

    expect(actions.confirmTiprack('left', '9')).toEqual(action)
  })

  it('CONFIRM_TIPRACK response actions', () => {
    const success = {
      type: 'robot:CONFIRM_TIPRACK_SUCCESS',
      payload: { tipOn: true },
    }

    const failure = {
      type: 'robot:CONFIRM_TIPRACK_FAILURE',
      error: true,
      payload: new Error('AH'),
    }

    expect(actions.confirmTiprackResponse(null, true)).toEqual(success)
    expect(actions.confirmTiprackResponse(new Error('AH'))).toEqual(failure)
  })

  it('probe tip action', () => {
    const expected = {
      type: actionTypes.PROBE_TIP,
      payload: { mount: 'left' },
      meta: { robotCommand: true },
    }

    expect(actions.probeTip('left')).toEqual(expected)
  })

  it('probe tip response action', () => {
    const success = {
      type: actionTypes.PROBE_TIP_RESPONSE,
      error: false,
    }
    const failure = {
      type: actionTypes.PROBE_TIP_RESPONSE,
      error: true,
      payload: new Error('AH'),
    }

    expect(actions.probeTipResponse()).toEqual(success)
    expect(actions.probeTipResponse(new Error('AH'))).toEqual(failure)
  })

  it('CONFIRM_PROBED action', () => {
    const expected = {
      type: 'robot:CONFIRM_PROBED',
      payload: 'left',
      meta: { robotCommand: true },
    }

    expect(actions.confirmProbed('left')).toEqual(expected)
  })

  it('MOVE_TO action', () => {
    const expected = {
      type: 'robot:MOVE_TO',
      payload: { mount: 'left', slot: '3' },
      meta: { robotCommand: true },
    }

    expect(actions.moveTo('left', '3')).toEqual(expected)
  })

  it('MOVE_TO response actions', () => {
    const success = {
      type: 'robot:MOVE_TO_SUCCESS',
      payload: {},
    }
    const failure = {
      type: 'robot:MOVE_TO_FAILURE',
      error: true,
      payload: new Error('AH'),
    }

    expect(actions.moveToResponse()).toEqual(success)
    expect(actions.moveToResponse(new Error('AH'))).toEqual(failure)
  })

  it('JOG action', () => {
    const expected = {
      type: 'robot:JOG',
      payload: { mount: 'left', axis: 'x', direction: -1, step: 10 },
      meta: { robotCommand: true },
    }

    expect(actions.jog('left', 'x', -1, 10)).toEqual(expected)
  })

  it('jog response action', () => {
    const success = {
      type: 'robot:JOG_SUCCESS',
      payload: {},
    }
    const failure = {
      type: 'robot:JOG_FAILURE',
      error: true,
      payload: new Error('AH'),
    }

    expect(actions.jogResponse()).toEqual(success)
    expect(actions.jogResponse(new Error('AH'))).toEqual(failure)
  })

  it('UPDATE_OFFSET action', () => {
    const expected = {
      type: 'robot:UPDATE_OFFSET',
      payload: { mount: 'left', slot: '2' },
      meta: { robotCommand: true },
    }

    expect(actions.updateOffset('left', '2')).toEqual(expected)
  })

  it('UPDATE_OFFSET response actions', () => {
    const success = {
      type: 'robot:UPDATE_OFFSET_SUCCESS',
      payload: {},
    }
    const failure = {
      type: 'robot:UPDATE_OFFSET_FAILURE',
      error: true,
      payload: new Error('AH'),
    }

    expect(actions.updateOffsetResponse()).toEqual(success)
    expect(actions.updateOffsetResponse(new Error('AH'))).toEqual(failure)
  })

  it('confirm labware action', () => {
    const expected = {
      type: actionTypes.CONFIRM_LABWARE,
      payload: { labware: '2' },
    }

    expect(actions.confirmLabware('2')).toEqual(expected)
  })

  it('run action', () => {
    const expected = {
      type: actionTypes.RUN,
      meta: { robotCommand: true },
    }

    expect(actions.run()).toEqual(expected)
  })

  it('run response action', () => {
    const success = { type: actionTypes.RUN_RESPONSE, error: false }
    const failure = {
      type: actionTypes.RUN_RESPONSE,
      payload: new Error('AH'),
      error: true,
    }

    expect(actions.runResponse()).toEqual(success)
    expect(actions.runResponse(new Error('AH'))).toEqual(failure)
  })

  it('pause action', () => {
    const expected = {
      type: actionTypes.PAUSE,
      meta: { robotCommand: true },
    }

    expect(actions.pause()).toEqual(expected)
  })

  it('pause response action', () => {
    const success = { type: actionTypes.PAUSE_RESPONSE, error: false }
    const failure = {
      type: actionTypes.PAUSE_RESPONSE,
      payload: new Error('AH'),
      error: true,
    }

    expect(actions.pauseResponse()).toEqual(success)
    expect(actions.pauseResponse(new Error('AH'))).toEqual(failure)
  })

  it('resume action', () => {
    const expected = {
      type: actionTypes.RESUME,
      meta: { robotCommand: true },
    }

    expect(actions.resume()).toEqual(expected)
  })

  it('resume response action', () => {
    const success = { type: actionTypes.RESUME_RESPONSE, error: false }
    const failure = {
      type: actionTypes.RESUME_RESPONSE,
      payload: new Error('AHHH'),
      error: true,
    }

    expect(actions.resumeResponse()).toEqual(success)
    expect(actions.resumeResponse(new Error('AHHH'))).toEqual(failure)
  })

  it('cancel action', () => {
    const expected = {
      type: actionTypes.CANCEL,
      meta: { robotCommand: true },
    }

    expect(actions.cancel()).toEqual(expected)
  })

  it('cancel response action', () => {
    const success = { type: actionTypes.CANCEL_RESPONSE, error: false }
    const failure = {
      type: actionTypes.CANCEL_RESPONSE,
      payload: new Error('AHHH'),
      error: true,
    }

    expect(actions.cancelResponse()).toEqual(success)
    expect(actions.cancelResponse(new Error('AHHH'))).toEqual(failure)
  })

  it('robot:REFRESH_SESSION action', () => {
    expect(actions.refreshSession()).toEqual({
      type: 'robot:REFRESH_SESSION',
      meta: { robotCommand: true },
    })
  })

  it('tick run time action', () => {
    const expected = { type: actionTypes.TICK_RUN_TIME }

    expect(actions.tickRunTime()).toEqual(expected)
  })
})
