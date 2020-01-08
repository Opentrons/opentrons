// calibration reducer tests
import { HOME } from '../../robot-controls'
import { robotReducer as reducer, actionTypes } from '../'

const EXPECTED_INITIAL_STATE = {
  deckPopulated: null,
  modulesReviewed: null,

  // intrument probed + basic tip-tracking flags
  // TODO(mc, 2018-01-22): combine these into subreducer
  probedByMount: {},
  tipOnByMount: {},

  // labware confirmed flags
  confirmedBySlot: {},

  // TODO(mc, 2018-01-22): make this state a sub-reducer
  calibrationRequest: { type: '', inProgress: false, error: null },
}

describe('robot reducer - calibration', () => {
  test('initial state', () => {
    const state = reducer(undefined, {})

    expect(state.calibration).toEqual(EXPECTED_INITIAL_STATE)
  })

  test('handles robot:REFRESH_SESSION', () => {
    const state = reducer(
      { calibration: {} },
      { type: 'robot:REFRESH_SESSION' }
    )

    expect(state.calibration).toEqual(EXPECTED_INITIAL_STATE)
  })

  test('handles DISCONNECT_RESPONSE success', () => {
    const expected = reducer(undefined, {}).calibration
    const state = { calibration: { dummy: 'state' } }
    const action = { type: 'robot:DISCONNECT_RESPONSE', payload: {} }

    expect(reducer(state, action).calibration).toEqual(expected)
  })

  test('handles protocol:UPLOAD', () => {
    const expected = reducer(undefined, {}).calibration
    const state = { calibration: { dummy: 'state' } }
    const action = {
      type: 'protocol:UPLOAD',
      payload: {},
    }

    expect(reducer(state, action).calibration).toEqual(expected)
  })

  test('handles SET_MODULES_REVIEWED action', () => {
    const setToTrue = { type: 'robot:SET_MODULES_REVIEWED', payload: true }
    const setToFalse = { type: 'robot:SET_MODULES_REVIEWED', payload: false }

    let state = { calibration: { modulesReviewed: false } }
    expect(reducer(state, setToTrue).calibration).toEqual({
      modulesReviewed: true,
    })

    state = { calibration: { modulesReviewed: true } }
    expect(reducer(state, setToFalse).calibration).toEqual({
      modulesReviewed: false,
    })
  })

  test('handles SET_DECK_POPULATED action', () => {
    const setToTrue = { type: actionTypes.SET_DECK_POPULATED, payload: true }
    const setToFalse = { type: actionTypes.SET_DECK_POPULATED, payload: false }

    let state = { calibration: { deckPopulated: false } }
    expect(reducer(state, setToTrue).calibration).toEqual({
      deckPopulated: true,
    })

    state = { calibration: { deckPopulated: true } }
    expect(reducer(state, setToFalse).calibration).toEqual({
      deckPopulated: false,
    })
  })

  test('handles PICKUP_AND_HOME action', () => {
    const state = {
      calibration: {
        deckPopulated: false,
        modulesReviewed: false,
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error(),
        },
      },
    }

    const action = {
      type: 'robot:PICKUP_AND_HOME',
      payload: { mount: 'left', slot: '5' },
    }
    expect(reducer(state, action).calibration).toEqual({
      deckPopulated: true,
      modulesReviewed: true,
      calibrationRequest: {
        type: 'PICKUP_AND_HOME',
        mount: 'left',
        slot: '5',
        inProgress: true,
        error: null,
      },
    })
  })

  test('handles PICKUP_AND_HOME response actions', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'PICKUP_AND_HOME',
          mount: 'left',
          slot: '5',
          inProgress: true,
          error: null,
        },
        tipOnByMount: { right: false },
      },
    }

    const success = {
      type: 'robot:PICKUP_AND_HOME_SUCCESS',
      payload: {},
    }

    const failure = {
      type: 'robot:PICKUP_AND_HOME_FAILURE',
      error: true,
      payload: new Error('AH'),
    }

    expect(reducer(state, success).calibration).toEqual({
      calibrationRequest: {
        type: 'PICKUP_AND_HOME',
        mount: 'left',
        slot: '5',
        inProgress: false,
        error: null,
      },
      tipOnByMount: { left: true, right: false },
    })

    expect(reducer(state, failure).calibration).toEqual({
      calibrationRequest: {
        type: 'PICKUP_AND_HOME',
        mount: 'left',
        slot: '5',
        inProgress: false,
        error: new Error('AH'),
      },
      tipOnByMount: { right: false },
    })
  })

  test('handles DROP_TIP_AND_HOME action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error('AH'),
        },
      },
    }
    const action = {
      type: 'robot:DROP_TIP_AND_HOME',
      payload: { mount: 'right', slot: '5' },
    }

    expect(reducer(state, action).calibration).toEqual({
      calibrationRequest: {
        type: 'DROP_TIP_AND_HOME',
        mount: 'right',
        slot: '5',
        inProgress: true,
        error: null,
      },
    })
  })

  test('handles DROP_TIP_AND_HOME response actions', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'DROP_TIP_AND_HOME',
          mount: 'right',
          slot: '5',
          inProgress: true,
          error: null,
        },
        tipOnByMount: { left: false, right: true },
      },
    }

    const success = {
      type: 'robot:DROP_TIP_AND_HOME_SUCCESS',
      payload: {},
    }

    const failure = {
      type: 'robot:DROP_TIP_AND_HOME_FAILURE',
      error: true,
      payload: new Error('AH'),
    }

    expect(reducer(state, success).calibration).toEqual({
      calibrationRequest: {
        type: 'DROP_TIP_AND_HOME',
        mount: 'right',
        slot: '5',
        inProgress: false,
        error: null,
      },
      tipOnByMount: { left: false, right: false },
    })

    expect(reducer(state, failure).calibration).toEqual({
      calibrationRequest: {
        type: 'DROP_TIP_AND_HOME',
        mount: 'right',
        slot: '5',
        inProgress: false,
        error: new Error('AH'),
      },
      tipOnByMount: { left: false, right: true },
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
          error: new Error('AH'),
        },
      },
    }
    const action = {
      type: 'robot:CONFIRM_TIPRACK',
      payload: { mount: 'right', slot: '5' },
    }

    expect(reducer(state, action).calibration).toEqual({
      calibrationRequest: {
        type: 'CONFIRM_TIPRACK',
        inProgress: true,
        error: null,
        mount: 'right',
        slot: '5',
      },
    })
  })

  test('handles CONFIRM_TIPRACK response actions', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'CONFIRM_TIPRACK',
          inProgress: true,
          error: null,
          mount: 'right',
          slot: '5',
        },
        tipOnByMount: { right: true },
        confirmedBySlot: { 5: false },
      },
    }

    const success = {
      type: 'robot:CONFIRM_TIPRACK_SUCCESS',
      payload: { tipOn: false },
    }

    const failure = {
      type: 'robot:CONFIRM_TIPRACK_FAILURE',
      error: true,
      payload: new Error('AH'),
    }

    expect(reducer(state, success).calibration).toEqual({
      calibrationRequest: {
        type: 'CONFIRM_TIPRACK',
        inProgress: false,
        error: null,
        mount: 'right',
        slot: '5',
      },
      tipOnByMount: { right: false },
      confirmedBySlot: { 5: true },
    })

    expect(reducer(state, failure).calibration).toEqual({
      calibrationRequest: {
        type: 'CONFIRM_TIPRACK',
        inProgress: false,
        error: new Error('AH'),
        mount: 'right',
        slot: '5',
      },
      tipOnByMount: { right: true },
      confirmedBySlot: { 5: false },
    })
  })

  test('handles MOVE_TO_FRONT action', () => {
    const state = {
      calibration: {
        deckPopulated: true,
        modulesReviewed: true,
        calibrationRequest: {
          type: '',
          mount: '',
          inProgress: false,
          error: new Error(),
        },
      },
    }
    const action = {
      type: actionTypes.MOVE_TO_FRONT,
      payload: { mount: 'left' },
    }

    expect(reducer(state, action).calibration).toEqual({
      deckPopulated: false,
      modulesReviewed: false,
      calibrationRequest: {
        type: 'MOVE_TO_FRONT',
        mount: 'left',
        inProgress: true,
        error: null,
      },
    })
  })

  test('handles MOVE_TO_FRONT_RESPONSE action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'MOVE_TO_FRONT',
          mount: 'right',
          inProgress: true,
          error: null,
        },
      },
    }

    const success = { type: actionTypes.MOVE_TO_FRONT_RESPONSE, error: false }
    const failure = {
      type: actionTypes.MOVE_TO_FRONT_RESPONSE,
      error: true,
      payload: new Error('AH'),
    }

    expect(reducer(state, success).calibration).toEqual({
      calibrationRequest: {
        type: 'MOVE_TO_FRONT',
        mount: 'right',
        inProgress: false,
        error: null,
      },
    })

    expect(reducer(state, failure).calibration).toEqual({
      calibrationRequest: {
        type: 'MOVE_TO_FRONT',
        mount: 'right',
        inProgress: false,
        error: new Error('AH'),
      },
    })
  })

  test('handles PROBE_TIP action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: '',
          mount: 'left',
          inProgress: false,
          error: new Error('AH'),
        },
        probedByMount: { left: true, right: true },
      },
    }
    const action = {
      type: actionTypes.PROBE_TIP,
      payload: { mount: 'left' },
    }

    expect(reducer(state, action).calibration).toEqual({
      calibrationRequest: {
        type: 'PROBE_TIP',
        mount: 'left',
        inProgress: true,
        error: null,
      },
      probedByMount: { left: false, right: true },
    })
  })

  test('handles PROBE_TIP_RESPONSE action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'PROBE_TIP',
          mount: 'right',
          inProgress: true,
          error: null,
        },
      },
    }
    const success = { type: actionTypes.PROBE_TIP_RESPONSE, error: false }
    const failure = {
      type: actionTypes.PROBE_TIP_RESPONSE,
      error: true,
      payload: new Error('AH'),
    }

    expect(reducer(state, success).calibration).toEqual({
      calibrationRequest: {
        type: 'PROBE_TIP',
        mount: 'right',
        inProgress: false,
        error: null,
      },
      confirmedBySlot: {},
    })
    expect(reducer(state, failure).calibration).toEqual({
      calibrationRequest: {
        type: 'PROBE_TIP',
        mount: 'right',
        inProgress: false,
        error: new Error('AH'),
      },
      confirmedBySlot: {},
    })
  })

  test('handles CONFIRM_PROBED', () => {
    const state = {
      calibration: {
        probedByMount: { left: false, right: true },
      },
    }
    const action = {
      type: 'robot:CONFIRM_PROBED',
      payload: 'left',
    }

    expect(reducer(state, action).calibration).toEqual({
      probedByMount: { left: true, right: true },
    })
  })

  test('handles MOVE_TO action', () => {
    const state = {
      calibration: {
        deckPopulated: false,
        modulesReviewed: false,
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error('AH'),
        },
      },
    }
    const action = {
      type: 'robot:MOVE_TO',
      payload: { mount: 'left', slot: '3' },
    }

    expect(reducer(state, action).calibration).toEqual({
      deckPopulated: true,
      modulesReviewed: true,
      calibrationRequest: {
        type: 'MOVE_TO',
        inProgress: true,
        error: null,
        mount: 'left',
        slot: '3',
      },
    })
  })

  test('handles MOVE_TO response actions', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'MOVE_TO',
          inProgress: true,
          error: null,
          mount: 'right',
          slot: '5',
        },
      },
    }

    const success = { type: 'robot:MOVE_TO_SUCCESS', payload: {} }
    const failure = {
      type: 'robot:MOVE_TO_FAILURE',
      error: true,
      payload: new Error('AH'),
    }

    expect(reducer(state, success).calibration).toEqual({
      calibrationRequest: {
        type: 'MOVE_TO',
        inProgress: false,
        error: null,
        mount: 'right',
        slot: '5',
      },
    })
    expect(reducer(state, failure).calibration).toEqual({
      calibrationRequest: {
        type: 'MOVE_TO',
        inProgress: false,
        error: new Error('AH'),
        mount: 'right',
        slot: '5',
      },
    })
  })

  test('handles JOG action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error(),
        },
      },
    }
    const action = { type: 'robot:JOG', payload: { mount: 'right' } }

    expect(reducer(state, action).calibration).toEqual({
      calibrationRequest: {
        type: 'JOG',
        inProgress: true,
        error: null,
        mount: 'right',
      },
    })
  })

  test('handles JOG response actions', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'JOG',
          inProgress: true,
          error: null,
          mount: 'right',
        },
      },
    }
    const success = {
      type: 'robot:JOG_SUCCESS',
      payload: {},
    }
    const failure = {
      type: 'robot:JOG_FAILURE',
      error: true,
      payload: new Error('AH'),
    }

    expect(reducer(state, success).calibration).toEqual({
      calibrationRequest: {
        type: 'JOG',
        inProgress: false,
        error: null,
        mount: 'right',
      },
    })
    expect(reducer(state, failure).calibration).toEqual({
      calibrationRequest: {
        type: 'JOG',
        inProgress: false,
        error: new Error('AH'),
        mount: 'right',
      },
    })
  })

  test('handles UPDATE_OFFSET action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error(),
        },
      },
    }
    const action = {
      type: 'robot:UPDATE_OFFSET',
      payload: { mount: 'right', slot: '5' },
    }

    expect(reducer(state, action).calibration).toEqual({
      calibrationRequest: {
        type: 'UPDATE_OFFSET',
        inProgress: true,
        error: null,
        mount: 'right',
        slot: '5',
      },
    })
  })

  test('handles UPDATE_OFFSET response actions', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'UPDATE_OFFSET',
          inProgress: true,
          error: null,
          mount: 'right',
          slot: '5',
        },
        confirmedBySlot: {},
      },
    }

    const success = {
      type: 'robot:UPDATE_OFFSET_SUCCESS',
      payload: {},
    }
    const failure = {
      type: 'robot:UPDATE_OFFSET_FAILURE',
      error: true,
      payload: new Error('AH'),
    }

    expect(reducer(state, success).calibration).toEqual({
      calibrationRequest: {
        type: 'UPDATE_OFFSET',
        inProgress: false,
        error: null,
        mount: 'right',
        slot: '5',
      },
      confirmedBySlot: { 5: true },
    })
    expect(reducer(state, failure).calibration).toEqual({
      calibrationRequest: {
        type: 'UPDATE_OFFSET',
        inProgress: false,
        error: new Error('AH'),
        mount: 'right',
        slot: '5',
      },
      confirmedBySlot: {},
    })
  })

  test('handles CONFIRM_LABWARE action', () => {
    const state = {
      calibration: {
        confirmedBySlot: {},
      },
    }
    const action = {
      type: actionTypes.CONFIRM_LABWARE,
      payload: { labware: '5' },
    }

    expect(reducer(state, action).calibration).toEqual({
      confirmedBySlot: { 5: true },
    })
  })

  test('handles CLEAR_CALIBRATION_REQUEST and robot home actions', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'JOG',
          inProgress: true,
          error: null,
          mount: 'right',
        },
      },
    }

    const clearAction = { type: 'robot:CLEAR_CALIBRATION_REQUEST' }
    expect(reducer(state, clearAction).calibration).toEqual({
      calibrationRequest: { type: '', inProgress: false, error: null },
    })

    const homeAction = { type: HOME }
    expect(reducer(state, homeAction).calibration).toEqual({
      calibrationRequest: { type: '', inProgress: false, error: null },
    })
  })

  test('handles RETURN_TIP action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error(),
        },
      },
    }
    const action = {
      type: actionTypes.RETURN_TIP,
      payload: { mount: 'left' },
    }

    expect(reducer(state, action).calibration).toEqual({
      calibrationRequest: {
        type: 'RETURN_TIP',
        inProgress: true,
        error: null,
        mount: 'left',
      },
    })
  })

  test('handles RETURN_TIP_RESPONSE action', () => {
    const state = {
      calibration: {
        calibrationRequest: {
          type: 'RETURN_TIP',
          inProgress: true,
          error: null,
          mount: 'left',
        },
        tipOnByMount: {
          left: true,
        },
      },
    }
    const action = {
      type: actionTypes.RETURN_TIP_RESPONSE,
    }

    expect(reducer(state, action).calibration).toEqual({
      calibrationRequest: {
        type: 'RETURN_TIP',
        inProgress: false,
        error: null,
        mount: 'left',
      },
      tipOnByMount: {
        left: false,
      },
    })
  })
})
