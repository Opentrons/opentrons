// calibration reducer tests
import {reducer, actionTypes, constants} from '../'

describe('robot reducer - calibration', () => {
  test('initial state', () => {
    const state = reducer(undefined, {}).calibration

    expect(state).toEqual({
      deckPopulated: true,
      jogDistance: constants.JOG_DISTANCE_SLOW_MM,

      // intrument probed + basic tip-tracking state
      // TODO(mc, 2018-01-22): combine these into subreducer
      probedByMount: {},
      tipOnByMount: {},

      // TODO(mc, 2017-11-07): labwareBySlot holds confirmation status by
      // slot. confirmedBySlot holds a flag for whether the labware has been
      // confirmed at least once. Rethink or combine these states
      labwareBySlot: {},
      confirmedBySlot: {},

      // TODO(mc, 2018-01-22): make this state a sub-reducer
      calibrationRequest: {type: '', inProgress: false, error: null},

      // TODO(mc, 2018-01-10): collapse all these into calibrationRequest
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

  test('handles SET_DECK_POPULATED action', () => {
    const setToTrue = {type: actionTypes.SET_DECK_POPULATED, payload: true}
    const setToFalse = {type: actionTypes.SET_DECK_POPULATED, payload: false}

    let state = {calibration: {deckPopulated: false}}
    expect(reducer(state, setToTrue).calibration).toEqual({
      deckPopulated: true
    })

    state = {calibration: {deckPopulated: true}}
    expect(reducer(state, setToFalse).calibration).toEqual({
      deckPopulated: false
    })
  })

  test('handles PICKUP_AND_HOME action', () => {
    const state = {
      calibration: {
        deckPopulated: false,
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error()
        },
        labwareBySlot: {5: constants.UNCONFIRMED}
      }
    }

    const action = {
      type: 'robot:PICKUP_AND_HOME',
      payload: {mount: 'left', slot: '5'}
    }
    expect(reducer(state, action).calibration).toEqual({
      deckPopulated: true,
      calibrationRequest: {
        type: 'PICKUP_AND_HOME',
        mount: 'left',
        slot: '5',
        inProgress: true,
        error: null
      },
      labwareBySlot: {5: constants.PICKING_UP}
    })
  })

  test('handles PICKUP_AND_HOME_RESPONSE action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'PICKUP_AND_HOME',
          mount: 'left',
          slot: '5',
          inProgress: true,
          error: null
        },
        tipOnByMount: {right: false},
        labwareBySlot: {5: constants.PICKING_UP}
      }
    }

    const success = {
      type: 'robot:PICKUP_AND_HOME_RESPONSE',
      error: false,
      payload: {}
    }

    const failure = {
      type: 'robot:PICKUP_AND_HOME_RESPONSE',
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, success).calibration).toEqual({
      calibrationRequest: {
        type: 'PICKUP_AND_HOME',
        mount: 'left',
        slot: '5',
        inProgress: false,
        error: null
      },
      tipOnByMount: {left: true, right: false},
      labwareBySlot: {5: constants.HOMED}
    })

    expect(reducer(state, failure).calibration).toEqual({
      calibrationRequest: {
        type: 'PICKUP_AND_HOME',
        mount: 'left',
        slot: '5',
        inProgress: false,
        error: new Error('AH')
      },
      tipOnByMount: {left: false, right: false},
      labwareBySlot: {5: constants.UNCONFIRMED}
    })
  })

  test('handles DROP_TIP_AND_HOME action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error('AH')
        },
        labwareBySlot: {5: constants.UNCONFIRMED}
      }
    }
    const action = {
      type: 'robot:DROP_TIP_AND_HOME',
      payload: {mount: 'right', slot: '5'}
    }

    expect(reducer(state, action).calibration).toEqual({
      calibrationRequest: {
        type: 'DROP_TIP_AND_HOME',
        mount: 'right',
        slot: '5',
        inProgress: true,
        error: null
      },
      labwareBySlot: {5: constants.HOMING}
    })
  })

  test('handles DROP_TIP_AND_HOME_RESPONSE action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'DROP_TIP_AND_HOME',
          mount: 'right',
          slot: '5',
          inProgress: true,
          error: null
        },
        tipOnByMount: {left: false, right: true},
        labwareBySlot: {5: constants.HOMING}
      }
    }

    const success = {
      type: 'robot:DROP_TIP_AND_HOME_RESPONSE',
      error: false,
      payload: {}
    }

    const failure = {
      type: 'robot:DROP_TIP_AND_HOME_RESPONSE',
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, success).calibration).toEqual({
      calibrationRequest: {
        type: 'DROP_TIP_AND_HOME',
        mount: 'right',
        slot: '5',
        inProgress: false,
        error: null
      },
      tipOnByMount: {left: false, right: false},
      labwareBySlot: {5: constants.HOMED}
    })

    expect(reducer(state, failure).calibration).toEqual({
      calibrationRequest: {
        type: 'DROP_TIP_AND_HOME',
        mount: 'right',
        slot: '5',
        inProgress: false,
        error: new Error('AH')
      },
      tipOnByMount: {left: false, right: true},
      labwareBySlot: {5: constants.UNCONFIRMED}
    })
  })

  test('handles CONFIRM_TIPRACK action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: '',
          mount: 'right',
          slot: '5',
          inProgress: false,
          error: new Error('AH')
        },
        labwareBySlot: {5: constants.UNCONFIRMED}
      }
    }
    const action = {
      type: 'robot:CONFIRM_TIPRACK',
      payload: {mount: 'right', slot: '5'}
    }

    expect(reducer(state, action).calibration).toEqual({
      calibrationRequest: {
        type: 'CONFIRM_TIPRACK',
        inProgress: true,
        error: null,
        mount: 'right',
        slot: '5'
      },
      labwareBySlot: {5: constants.CONFIRMING}
    })
  })

  test('handles CONFIRM_TIPRACK_RESPONSE action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'CONFIRM_TIPRACK',
          inProgress: true,
          error: null,
          mount: 'right',
          slot: '5'
        },
        tipOnByMount: {right: true},
        labwareBySlot: {5: constants.CONFIRMING},
        confirmedBySlot: {5: false}
      }
    }

    const success = {
      type: 'robot:CONFIRM_TIPRACK_RESPONSE',
      error: false,
      payload: {tipOn: false}
    }

    const failure = {
      type: 'robot:CONFIRM_TIPRACK_RESPONSE',
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, success).calibration).toEqual({
      calibrationRequest: {
        type: 'CONFIRM_TIPRACK',
        inProgress: false,
        error: null,
        mount: 'right',
        slot: '5'
      },
      tipOnByMount: {right: false},
      labwareBySlot: {5: constants.CONFIRMED},
      confirmedBySlot: {5: true}
    })

    expect(reducer(state, failure).calibration).toEqual({
      calibrationRequest: {
        type: 'CONFIRM_TIPRACK',
        inProgress: false,
        error: new Error('AH'),
        mount: 'right',
        slot: '5'
      },
      tipOnByMount: {right: true},
      labwareBySlot: {5: constants.UNCONFIRMED},
      confirmedBySlot: {5: false}
    })
  })

  test('handles MOVE_TO_FRONT action', () => {
    const state = {
      calibration: {
        deckPopulated: true,
        calibrationRequest: {
          type: '',
          mount: '',
          inProgress: false,
          error: new Error()
        }
      }
    }
    const action = {
      type: actionTypes.MOVE_TO_FRONT,
      payload: {instrument: 'left'}
    }

    expect(reducer(state, action).calibration).toEqual({
      deckPopulated: false,
      calibrationRequest: {
        type: 'MOVE_TO_FRONT',
        mount: 'left',
        inProgress: true,
        error: null
      }
    })
  })

  test('handles MOVE_TO_FRONT_RESPONSE action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'MOVE_TO_FRONT',
          mount: 'right',
          inProgress: true,
          error: null
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
      calibrationRequest: {
        type: 'MOVE_TO_FRONT',
        mount: 'right',
        inProgress: false,
        error: null
      }
    })

    expect(reducer(state, failure).calibration).toEqual({
      calibrationRequest: {
        type: 'MOVE_TO_FRONT',
        mount: 'right',
        inProgress: false,
        error: new Error('AH')
      }
    })
  })

  test('handles PROBE_TIP action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: '',
          mount: 'left',
          inProgress: false,
          error: new Error('AH')
        },
        probedByMount: {left: true, right: true}
      }
    }
    const action = {
      type: actionTypes.PROBE_TIP,
      payload: {instrument: 'left'}
    }

    expect(reducer(state, action).calibration).toEqual({
      calibrationRequest: {
        type: 'PROBE_TIP',
        mount: 'left',
        inProgress: true,
        error: null
      },
      probedByMount: {left: false, right: true}
    })
  })

  test('handles PROBE_TIP_RESPONSE action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'PROBE_TIP',
          mount: 'right',
          inProgress: true,
          error: null
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
      calibrationRequest: {
        type: 'PROBE_TIP',
        mount: 'right',
        inProgress: false,
        error: null
      }
    })
    expect(reducer(state, failure).calibration).toEqual({
      calibrationRequest: {
        type: 'PROBE_TIP',
        mount: 'right',
        inProgress: false,
        error: new Error('AH')
      }
    })
  })

  test('handles CONFIRM_PROBED', () => {
    const state = {
      calibration: {
        probedByMount: {left: false, right: true}
      }
    }
    const action = {
      type: 'robot:CONFIRM_PROBED',
      payload: 'left'
    }

    expect(reducer(state, action).calibration).toEqual({
      probedByMount: {left: true, right: true}
    })
  })

  test('handles MOVE_TO action', () => {
    const state = {
      calibration: {
        deckPopulated: false,
        moveToRequest: {inProgress: false, error: new Error()},
        labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.UNCONFIRMED}
      }
    }
    const action = {
      type: actionTypes.MOVE_TO,
      payload: {labware: '3'}
    }

    expect(reducer(state, action).calibration).toEqual({
      deckPopulated: true,
      moveToRequest: {inProgress: true, error: null, slot: '3'},
      labwareBySlot: {3: constants.MOVING_TO_SLOT, 5: constants.UNCONFIRMED}
    })
  })

  test('handles MOVE_TO_RESPONSE action', () => {
    const state = {
      calibration: {
        moveToRequest: {inProgress: true, error: null, slot: '5'},
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
      moveToRequest: {inProgress: false, error: null, slot: '5'},
      labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.OVER_SLOT}
    })
    expect(reducer(state, failure).calibration).toEqual({
      moveToRequest: {inProgress: false, error: new Error('AH'), slot: '5'},
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
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error()
        },
        labwareBySlot: {}
      }
    }
    const action = {
      type: 'robot:UPDATE_OFFSET',
      payload: {mount: 'right', slot: '5'}
    }

    expect(reducer(state, action).calibration).toEqual({
      calibrationRequest: {
        type: 'UPDATE_OFFSET',
        inProgress: true,
        error: null,
        mount: 'right',
        slot: '5'
      },
      labwareBySlot: {5: constants.UPDATING}
    })
  })

  test('handles UPDATE_OFFSET_RESPONSE action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'UPDATE_OFFSET',
          inProgress: true,
          error: null,
          mount: 'right',
          slot: '5'
        },
        tipOnByMount: {},
        labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.UPDATING},
        confirmedBySlot: {}
      }
    }

    const successNonTiprack = {
      type: 'robot:UPDATE_OFFSET_RESPONSE',
      error: false,
      payload: {isTiprack: false}
    }
    const successTiprack = {
      type: 'robot:UPDATE_OFFSET_RESPONSE',
      error: false,
      payload: {isTiprack: true}
    }
    const failure = {
      type: 'robot:UPDATE_OFFSET_RESPONSE',
      error: true,
      payload: new Error('AH')
    }

    expect(reducer(state, successNonTiprack).calibration).toEqual({
      calibrationRequest: {
        type: 'UPDATE_OFFSET',
        inProgress: false,
        error: null,
        mount: 'right',
        slot: '5'
      },
      tipOnByMount: {},
      labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.CONFIRMED},
      confirmedBySlot: {5: true}
    })
    expect(reducer(state, successTiprack).calibration).toEqual({
      calibrationRequest: {
        type: 'UPDATE_OFFSET',
        inProgress: false,
        error: null,
        mount: 'right',
        slot: '5'
      },
      tipOnByMount: {right: true},
      labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.UPDATED},
      confirmedBySlot: {}
    })
    expect(reducer(state, failure).calibration).toEqual({
      calibrationRequest: {
        type: 'UPDATE_OFFSET',
        inProgress: false,
        error: new Error('AH'),
        mount: 'right',
        slot: '5'
      },
      tipOnByMount: {},
      labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.UNCONFIRMED},
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
    const action = {type: actionTypes.CONFIRM_LABWARE, payload: {labware: '5'}}

    expect(reducer(state, action).calibration).toEqual({
      labwareBySlot: {3: constants.UNCONFIRMED, 5: constants.CONFIRMED},
      confirmedBySlot: {5: true}
    })
  })
})
