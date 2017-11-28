// calibration reducer tests
import {reducer, actionTypes, constants} from '../'

describe('robot reducer - calibration', () => {
  test('initial state', () => {
    const state = reducer(undefined, {}).calibration

    expect(state).toEqual({
      labwareReviewed: false,
      jogDistance: constants.JOG_DISTANCE_SLOW_MM,
      // TODO(mc, 2017-11-03): instrumentsByAxis holds calibration status by
      // axis. probedByAxis holds a flag for whether the instrument has been
      // probed at least once by axis. Rethink or combine these states
      instrumentsByAxis: {},
      probedByAxis: {},

      // TODO(mc, 2017-11-07): labwareBySlot holds confirmation status by
      // slot. confirmedBySlot holds a flag for whether the labware has been
      // confirmed at least once. Rethink or combine these states
      labwareBySlot: {},
      confirmedBySlot: {},

      // TODO(mc, 2017-11-22): collapse all these into a single request atom
      // with enum for request type rather than inProgress flag. We can't have
      // simultaneous instrument movements so split state doesn't help
      pickupRequest: {inProgress: false, error: null, slot: 0},
      homeRequest: {inProgress: false, error: null, slot: 0},
      confirmTiprackRequest: {inProgress: false, error: null, slot: 0},

      moveToFrontRequest: {inProgress: false, error: null, axis: ''},
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

  test('handles SESSION', () => {
    const expected = reducer(undefined, {}).calibration
    const state = {calibration: {dummy: 'state'}}
    const action = {
      type: actionTypes.SESSION,
      payload: {file: {name: 'foobar.py'}}
    }

    expect(reducer(state, action).calibration).toEqual(expected)
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

  test('handles PICKUP_AND_HOME action', () => {
    const state = {
      calibration: {
        pickupRequest: {inProgress: false, error: new Error(), slot: 0},
        labwareBySlot: {5: constants.UNCONFIRMED}
      }
    }

    const action = {
      type: actionTypes.PICKUP_AND_HOME,
      payload: {instrument: 'left', labware: 5}
    }
    expect(reducer(state, action).calibration).toEqual({
      pickupRequest: {inProgress: true, error: null, slot: 5},
      labwareBySlot: {5: constants.PICKING_UP}
    })
  })

  test('handles PICKUP_AND_HOME_RESPONSE action', () => {
    const state = {
      calibration: {
        pickupRequest: {inProgress: true, error: null, slot: 5},
        labwareBySlot: {5: constants.PICKING_UP}
      }
    }

    const success = {type: actionTypes.PICKUP_AND_HOME_RESPONSE}

    const failure = {
      type: actionTypes.PICKUP_AND_HOME_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, success).calibration).toEqual({
      pickupRequest: {inProgress: false, error: null, slot: 5},
      labwareBySlot: {5: constants.HOMED}
    })

    expect(reducer(state, failure).calibration).toEqual({
      pickupRequest: {inProgress: false, error: new Error('AH'), slot: 5},
      labwareBySlot: {5: constants.UNCONFIRMED}
    })
  })

  test('handles HOME_INSTRUMENT action', () => {
    const state = {
      calibration: {
        homeRequest: {inProgress: false, error: new Error('AH'), slot: 0},
        labwareBySlot: {5: constants.UNCONFIRMED}
      }
    }
    const action = {
      type: actionTypes.HOME_INSTRUMENT,
      payload: {instrument: 'right', labware: 5}
    }

    expect(reducer(state, action).calibration).toEqual({
      homeRequest: {inProgress: true, error: null, slot: 5},
      labwareBySlot: {5: constants.HOMING}
    })
  })

  test('handles HOME_INSTRUMENT_RESPONSE action', () => {
    const state = {
      calibration: {
        homeRequest: {inProgress: true, error: null, slot: 5},
        labwareBySlot: {5: constants.HOMING}
      }
    }

    const success = {type: actionTypes.HOME_INSTRUMENT_RESPONSE}

    const failure = {
      type: actionTypes.HOME_INSTRUMENT_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, success).calibration).toEqual({
      homeRequest: {inProgress: false, error: null, slot: 5},
      labwareBySlot: {5: constants.HOMED}
    })

    expect(reducer(state, failure).calibration).toEqual({
      homeRequest: {inProgress: false, error: new Error('AH'), slot: 5},
      labwareBySlot: {5: constants.UNCONFIRMED}
    })
  })

  test('handles CONFIRM_TIPRACK action', () => {
    const state = {
      calibration: {
        confirmTiprackRequest: {
          inProgress: false,
          error: new Error('AH'),
          slot: 0
        },
        labwareBySlot: {5: constants.UNCONFIRMED}
      }
    }
    const action = {
      type: actionTypes.CONFIRM_TIPRACK,
      payload: {instrument: 'right', labware: 5}
    }

    expect(reducer(state, action).calibration).toEqual({
      confirmTiprackRequest: {inProgress: true, error: null, slot: 5},
      labwareBySlot: {5: constants.CONFIRMING}
    })
  })

  test('handles CONFIRM_TIPRACK_RESPONSE action', () => {
    const state = {
      calibration: {
        confirmTiprackRequest: {inProgress: true, error: null, slot: 5},
        labwareBySlot: {5: constants.CONFIRMING},
        confirmedBySlot: {5: false}
      }
    }

    const success = {type: actionTypes.CONFIRM_TIPRACK_RESPONSE}

    const failure = {
      type: actionTypes.CONFIRM_TIPRACK_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, success).calibration).toEqual({
      confirmTiprackRequest: {inProgress: false, error: null, slot: 5},
      labwareBySlot: {5: constants.CONFIRMED},
      confirmedBySlot: {5: true}
    })

    expect(reducer(state, failure).calibration).toEqual({
      confirmTiprackRequest: {
        inProgress: false,
        error: new Error('AH'),
        slot: 5
      },
      labwareBySlot: {5: constants.UNCONFIRMED},
      confirmedBySlot: {5: false}
    })
  })

  test('handles MOVE_TO_FRONT action', () => {
    const state = {
      calibration: {
        moveToFrontRequest: {inProgress: false, error: new Error()},
        instrumentsByAxis: {
          left: constants.UNPROBED,
          right: constants.READY_TO_PROBE
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
        },
        probedByAxis: {}
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
      },
      probedByAxis: {
        right: true
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
      },
      probedByAxis: {
        right: false
      }
    })
  })

  test('handles RESET_TIP_PROBE', () => {
    const state = {
      calibration: {
        instrumentsByAxis: {
          left: constants.UNPROBED,
          right: constants.PROBED
        }
      }
    }
    const action = {
      type: actionTypes.RESET_TIP_PROBE,
      payload: {instrument: 'right'}
    }

    expect(reducer(state, action).calibration).toEqual({
      instrumentsByAxis: {
        left: constants.UNPROBED,
        right: constants.UNPROBED
      }
    })
  })

  test('handles MOVE_TO action', () => {
    const state = {
      calibration: {
        labwareReviewed: false,
        moveToRequest: {inProgress: false, error: new Error()},
        labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.UNCONFIRMED}
      }
    }
    const action = {
      type: actionTypes.MOVE_TO,
      payload: {labware: 3}
    }

    expect(reducer(state, action).calibration).toEqual({
      labwareReviewed: true,
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

  test('handles TOGGLE_JOG_DISTANCE action', () => {
    const slow = {calibration: {jogDistance: constants.JOG_DISTANCE_SLOW_MM}}
    const fast = {calibration: {jogDistance: constants.JOG_DISTANCE_FAST_MM}}
    const action = {type: actionTypes.TOGGLE_JOG_DISTANCE}

    expect(reducer(slow, action).calibration).toEqual({
      jogDistance: constants.JOG_DISTANCE_FAST_MM
    })
    expect(reducer(fast, action).calibration).toEqual({
      jogDistance: constants.JOG_DISTANCE_SLOW_MM
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
        labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.OVER_SLOT},
        confirmedBySlot: {}
      }
    }

    const successNonTiprack = {
      type: actionTypes.UPDATE_OFFSET_RESPONSE,
      error: false,
      payload: {isTiprack: false}
    }
    const successTiprack = {
      type: actionTypes.UPDATE_OFFSET_RESPONSE,
      error: false,
      payload: {isTiprack: true}
    }
    const failure = {
      type: actionTypes.UPDATE_OFFSET_RESPONSE,
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, successNonTiprack).calibration).toEqual({
      updateOffsetRequest: {inProgress: false, error: null, slot: 5},
      labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.CONFIRMED},
      confirmedBySlot: {5: true}
    })
    expect(reducer(state, successTiprack).calibration).toEqual({
      updateOffsetRequest: {inProgress: false, error: null, slot: 5},
      labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.OVER_SLOT},
      confirmedBySlot: {}
    })
    expect(reducer(state, failure).calibration).toEqual({
      updateOffsetRequest: {inProgress: false, error: new Error('AH'), slot: 5},
      labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.OVER_SLOT},
      confirmedBySlot: {5: false}
    })
  })

  test('handles CONFIRM_LABWARE action', () => {
    const state = {
      calibration: {
        labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.OVER_SLOT},
        confirmedBySlot: {}
      }
    }
    const action = {type: actionTypes.CONFIRM_LABWARE, payload: {labware: 5}}

    expect(reducer(state, action).calibration).toEqual({
      labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.CONFIRMED},
      confirmedBySlot: {5: true}
    })
  })
})
