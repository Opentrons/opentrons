// calibration reducer tests
import {reducer, actionTypes, constants} from '../'

describe('robot reducer - calibration', () => {
  test('initial state', () => {
    const state = reducer(undefined, {}).calibration

    expect(state).toEqual({
      labwareReviewed: false,
      instrumentsByAxis: {},
      labwareBySlot: {},

      // homeRequest: {inProgress: false, error: null},
      // TODO(mc, 2017-10-17): collapse moveToFront and probeTip request state
      moveToFrontRequest: {inProgress: false, error: null},
      probeTipRequest: {inProgress: false, error: null},
      moveToRequest: {inProgress: false, error: null},
      jogRequest: {inProgress: false, error: null},
      updateOffsetRequest: {inProgress: false, error: null}
    })
  })

  test('handles DISCONNECT_RESPONSE success', () => {
    const expected = reducer(undefined, {}).calibration
    const state = {calibration: {dummy: 'state'}}
    const action = {type: actionTypes.DISCONNECT_RESPONSE, error: false}

    expect(reducer(state, action).calibration).toEqual(expected)
  })

  test('handles DISCONNECT_RESPONSE failure', () => {
    const state = {calibration: {dummy: 'state'}}
    const action = {type: actionTypes.DISCONNECT_RESPONSE, error: true}

    expect(reducer(state, action).calibration).toEqual(state.calibration)
  })

  test('handles SET_LABWARE_REVIEWED action', () => {
    const setToTrue = {type: actionTypes.SET_LABWARE_REVIEWED, payload: true}
    const setToFalse = {type: actionTypes.SET_LABWARE_REVIEWED, payload: false}

    let state = {calibration: {labwareReviewed: false}}
    expect(reducer(state, setToTrue).calibration).toEqual({
      labwareReviewed: true
    })

    state = {calibration: {labwareReviewed: true}}
    expect(reducer(state, setToFalse).calibration).toEqual({
      labwareReviewed: false
    })
  })

  // TODO(mc, 2017-10-17): implement home when api.calibration_manager can home
  // test('handles HOME action', () => {})
  // test('handles HOME_RESPONSE success', () => {})
  // test('handles HOME_RESPONSE failure', () => {})

  test('handles MOVE_TO_FRONT action', () => {
    const state = {
      calibration: {
        moveToFrontRequest: {inProgress: false, error: new Error()},
        instrumentsByAxis: {
          left: constants.UNPROBED,
          right: constants.UNPROBED
        }
      }
    }
    const action = {
      type: actionTypes.MOVE_TO_FRONT,
      payload: {instrument: 'left'}
    }

    expect(reducer(state, action).calibration).toEqual({
      moveToFrontRequest: {inProgress: true, error: null, axis: 'left'},
      instrumentsByAxis: {
        left: constants.PREPARING_TO_PROBE,
        right: constants.UNPROBED
      }
    })
  })

  test('handles MOVE_TO_FRONT_RESPONSE action', () => {
    const state = {
      calibration: {
        moveToFrontRequest: {inProgress: true, error: null, axis: 'right'},
        instrumentsByAxis: {
          left: constants.UNPROBED,
          right: constants.PREPARING_TO_PROBE
        }
      }
    }

    const success = {type: actionTypes.MOVE_TO_FRONT_RESPONSE, error: false}
    const failure = {
      type: actionTypes.MOVE_TO_FRONT_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, success).calibration).toEqual({
      moveToFrontRequest: {inProgress: false, error: null, axis: 'right'},
      instrumentsByAxis: {
        left: constants.UNPROBED,
        right: constants.READY_TO_PROBE
      }
    })

    expect(reducer(state, failure).calibration).toEqual({
      moveToFrontRequest: {
        inProgress: false,
        error: new Error('AH'),
        axis: 'right'
      },
      instrumentsByAxis: {
        left: constants.UNPROBED,
        right: constants.UNPROBED
      }
    })
  })

  test('handles PROBE_TIP action', () => {
    const state = {
      calibration: {
        probeTipRequest: {inProgress: false, error: new Error(), axis: 'right'},
        instrumentsByAxis: {
          left: constants.READY_TO_PROBE,
          right: constants.UNPROBED
        }
      }
    }
    const action = {
      type: actionTypes.PROBE_TIP,
      payload: {instrument: 'left'}
    }

    expect(reducer(state, action).calibration).toEqual({
      probeTipRequest: {inProgress: true, error: null, axis: 'left'},
      instrumentsByAxis: {
        left: constants.PROBING,
        right: constants.UNPROBED
      }
    })
  })

  test('handles PROBE_TIP_RESPONSE action', () => {
    const state = {
      calibration: {
        probeTipRequest: {inProgress: true, error: null, axis: 'right'},
        instrumentsByAxis: {
          left: constants.UNPROBED,
          right: constants.PROBING
        }
      }
    }
    const success = {type: actionTypes.PROBE_TIP_RESPONSE, error: false}
    const failure = {
      type: actionTypes.PROBE_TIP_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, success).calibration).toEqual({
      probeTipRequest: {
        inProgress: false,
        error: null,
        axis: 'right'
      },
      instrumentsByAxis: {
        left: constants.UNPROBED,
        right: constants.PROBED
      }
    })
    expect(reducer(state, failure).calibration).toEqual({
      probeTipRequest: {
        inProgress: false,
        error: new Error('AH'),
        axis: 'right'
      },
      instrumentsByAxis: {
        left: constants.UNPROBED,
        right: constants.UNPROBED
      }
    })
  })

  test('handles MOVE_TO action', () => {
    const state = {
      calibration: {
        moveToRequest: {inProgress: false, error: new Error()},
        labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.UNCONFIRMED}
      }
    }
    const action = {
      type: actionTypes.MOVE_TO,
      payload: {labware: 3}
    }

    expect(reducer(state, action).calibration).toEqual({
      moveToRequest: {inProgress: true, error: null, slot: 3},
      labwareBySlot: {3: constants.MOVING_TO_SLOT, 5: constants.UNCONFIRMED}
    })
  })

  test('handles MOVE_TO_RESPONSE action', () => {
    const state = {
      calibration: {
        moveToRequest: {inProgress: true, error: null, slot: 5},
        labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.MOVING_TO_SLOT}
      }
    }

    const success = {type: actionTypes.MOVE_TO_RESPONSE, error: false}
    const failure = {
      type: actionTypes.MOVE_TO_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, success).calibration).toEqual({
      moveToRequest: {inProgress: false, error: null, slot: 5},
      labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.OVER_SLOT}
    })
    expect(reducer(state, failure).calibration).toEqual({
      moveToRequest: {inProgress: false, error: new Error('AH'), slot: 5},
      labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.UNCONFIRMED}
    })
  })

  test('handles JOG action', () => {
    const state = {
      calibration: {
        jogRequest: {inProgress: false, error: new Error()}
      }
    }
    const action = {type: actionTypes.JOG}

    expect(reducer(state, action).calibration).toEqual({
      jogRequest: {inProgress: true, error: null}
    })
  })

  test('handles JOG_RESPONSE action', () => {
    const state = {calibration: {jogRequest: {inProgress: true, error: null}}}
    const success = {type: actionTypes.JOG_RESPONSE, error: false}
    const failure = {
      type: actionTypes.JOG_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, success).calibration).toEqual({
      jogRequest: {inProgress: false, error: null}
    })
    expect(reducer(state, failure).calibration).toEqual({
      jogRequest: {inProgress: false, error: new Error('AH')}
    })
  })

  test('handles UPDATE_OFFSET action', () => {
    const state = {
      calibration: {
        updateOffsetRequest: {inProgress: false, error: new Error()}
      }
    }
    const action = {type: actionTypes.UPDATE_OFFSET, payload: {labware: 5}}

    expect(reducer(state, action).calibration).toEqual({
      updateOffsetRequest: {inProgress: true, error: null, slot: 5}
    })
  })

  test('handles UPDATE_OFFSET_RESPONSE action', () => {
    const state = {
      calibration: {
        updateOffsetRequest: {inProgress: true, error: null, slot: 5},
        labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.OVER_SLOT}
      }
    }

    const success = {type: actionTypes.UPDATE_OFFSET_RESPONSE, error: false}
    const failure = {
      type: actionTypes.UPDATE_OFFSET_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, success).calibration).toEqual({
      updateOffsetRequest: {inProgress: false, error: null, slot: 5},
      labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.CONFIRMED}
    })
    expect(reducer(state, failure).calibration).toEqual({
      updateOffsetRequest: {inProgress: false, error: new Error('AH'), slot: 5},
      labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.OVER_SLOT}
    })
  })

  test('handles CONFIRM_LABWARE action', () => {
    const state = {
      calibration: {
        labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.OVER_SLOT}
      }
    }
    const action = {type: actionTypes.CONFIRM_LABWARE, payload: {labware: 5}}

    expect(reducer(state, action).calibration).toEqual({
      labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.CONFIRMED}
    })
  })
})
