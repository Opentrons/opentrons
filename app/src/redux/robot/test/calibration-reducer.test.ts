// calibration reducer tests
import { HOME } from '../../robot-controls'
import { robotReducer as reducer, actionTypes } from '..'

import type { Action } from '../../types'
import type { RobotState } from '..'

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
  it('initial state', () => {
    const state = reducer(undefined, {} as any)

    expect(state.calibration).toEqual(EXPECTED_INITIAL_STATE)
  })

  it('handles robot:REFRESH_SESSION', () => {
    const state = reducer(
      { calibration: {} } as any,
      { type: 'robot:REFRESH_SESSION' } as any
    )

    expect(state.calibration).toEqual(EXPECTED_INITIAL_STATE)
  })

  it('handles DISCONNECT_RESPONSE success', () => {
    const expected = reducer(undefined, {} as any).calibration
    const state: RobotState = { calibration: { dummy: 'state' } } as any
    const action: Action = { type: 'robot:DISCONNECT_RESPONSE', payload: {} }

    expect(reducer(state, action).calibration).toEqual(expected)
  })

  it('handles protocol:UPLOAD', () => {
    const expected = reducer(undefined, {} as any).calibration
    const state: RobotState = { calibration: { dummy: 'state' } } as any
    const action: Action = {
      type: 'protocol:UPLOAD',
      payload: {} as any,
      meta: {} as any,
    }

    expect(reducer(state, action).calibration).toEqual(expected)
  })

  it('handles SET_MODULES_REVIEWED action', () => {
    const setToTrue: Action = {
      type: 'robot:SET_MODULES_REVIEWED',
      payload: true,
    }
    const setToFalse: Action = {
      type: 'robot:SET_MODULES_REVIEWED',
      payload: false,
    }

    let state: RobotState = { calibration: { modulesReviewed: false } } as any
    expect(reducer(state, setToTrue).calibration).toEqual({
      modulesReviewed: true,
    })

    state = { calibration: { modulesReviewed: true } } as any
    expect(reducer(state, setToFalse).calibration).toEqual({
      modulesReviewed: false,
    })
  })

  it('handles SET_DECK_POPULATED action', () => {
    const setToTrue = {
      type: actionTypes.SET_DECK_POPULATED,
      payload: true,
    } as any
    const setToFalse = {
      type: actionTypes.SET_DECK_POPULATED,
      payload: false,
    } as any

    let state: RobotState = { calibration: { deckPopulated: false } } as any
    expect(reducer(state, setToTrue).calibration).toEqual({
      deckPopulated: true,
    })

    state = { calibration: { deckPopulated: true } } as any
    expect(reducer(state, setToFalse).calibration).toEqual({
      deckPopulated: false,
    })
  })

  it('handles PICKUP_AND_HOME action', () => {
    const state: RobotState = {
      calibration: {
        deckPopulated: false,
        modulesReviewed: false,
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error(),
        },
      },
    } as any

    const action: Action = {
      type: 'robot:PICKUP_AND_HOME',
      payload: { mount: 'left', slot: '5' },
      meta: {} as any,
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

  it('handles PICKUP_AND_HOME response actions', () => {
    const state: RobotState = {
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
    } as any

    const success: Action = {
      type: 'robot:PICKUP_AND_HOME_SUCCESS',
      payload: {},
    }

    const failure: Action = {
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

  it('handles DROP_TIP_AND_HOME action', () => {
    const state: RobotState = {
      calibration: {
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error('AH'),
        },
      },
    } as any
    const action: Action = {
      type: 'robot:DROP_TIP_AND_HOME',
      payload: { mount: 'right', slot: '5' },
      meta: {} as any,
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

  it('handles DROP_TIP_AND_HOME response actions', () => {
    const state: RobotState = {
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
    } as any

    const success: Action = {
      type: 'robot:DROP_TIP_AND_HOME_SUCCESS',
      payload: {},
    }

    const failure: Action = {
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

  it('handles CONFIRM_TIPRACK action', () => {
    const state: RobotState = {
      calibration: {
        calibrationRequest: {
          type: '',
          mount: 'right',
          slot: '5',
          inProgress: false,
          error: new Error('AH'),
        },
      },
    } as any
    const action: Action = {
      type: 'robot:CONFIRM_TIPRACK',
      payload: { mount: 'right', slot: '5' },
      meta: {} as any,
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

  it('handles CONFIRM_TIPRACK response actions', () => {
    const state: RobotState = {
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
    } as any

    const success: Action = {
      type: 'robot:CONFIRM_TIPRACK_SUCCESS',
      payload: { tipOn: false },
    }

    const failure: Action = {
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

  it('handles MOVE_TO_FRONT action', () => {
    const state: RobotState = {
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
    } as any
    const action = {
      type: actionTypes.MOVE_TO_FRONT,
      payload: { mount: 'left' },
    } as any

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

  it('handles MOVE_TO_FRONT_RESPONSE action', () => {
    const state: RobotState = {
      calibration: {
        calibrationRequest: {
          type: 'MOVE_TO_FRONT',
          mount: 'right',
          inProgress: true,
          error: null,
        },
      },
    } as any

    const success = {
      type: actionTypes.MOVE_TO_FRONT_RESPONSE,
      error: false,
    } as any
    const failure = {
      type: actionTypes.MOVE_TO_FRONT_RESPONSE,
      error: true,
      payload: new Error('AH'),
    } as any

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

  it('handles PROBE_TIP action', () => {
    const state: RobotState = {
      calibration: {
        calibrationRequest: {
          type: '',
          mount: 'left',
          inProgress: false,
          error: new Error('AH'),
        },
        probedByMount: { left: true, right: true },
      },
    } as any
    const action = {
      type: actionTypes.PROBE_TIP,
      payload: { mount: 'left' },
    } as any

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

  it('handles PROBE_TIP_RESPONSE action', () => {
    const state: RobotState = {
      calibration: {
        calibrationRequest: {
          type: 'PROBE_TIP',
          mount: 'right',
          inProgress: true,
          error: null,
        },
      },
    } as any
    const success = {
      type: actionTypes.PROBE_TIP_RESPONSE,
      error: false,
    } as any
    const failure = {
      type: actionTypes.PROBE_TIP_RESPONSE,
      error: true,
      payload: new Error('AH'),
    } as any

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

  it('handles CONFIRM_PROBED', () => {
    const state: RobotState = {
      calibration: {
        probedByMount: { left: false, right: true },
      },
    } as any
    const action: Action = {
      type: 'robot:CONFIRM_PROBED',
      payload: 'left',
      meta: {} as any,
    }

    expect(reducer(state, action).calibration).toEqual({
      probedByMount: { left: true, right: true },
    })
  })

  it('handles MOVE_TO action', () => {
    const state: RobotState = {
      calibration: {
        deckPopulated: false,
        modulesReviewed: false,
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error('AH'),
        },
      },
    } as any
    const action: Action = {
      type: 'robot:MOVE_TO',
      payload: { mount: 'left', slot: '3' },
      meta: {} as any,
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

  it('handles MOVE_TO response actions', () => {
    const state: RobotState = {
      calibration: {
        calibrationRequest: {
          type: 'MOVE_TO',
          inProgress: true,
          error: null,
          mount: 'right',
          slot: '5',
        },
      },
    } as any

    const success: Action = { type: 'robot:MOVE_TO_SUCCESS', payload: {} }
    const failure: Action = {
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

  it('handles JOG action', () => {
    const state: RobotState = {
      calibration: {
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error(),
        },
      },
    } as any
    const action: Action = {
      type: 'robot:JOG',
      payload: { mount: 'right' },
      meta: {} as any,
    }
    expect(reducer(state, action).calibration).toEqual({
      calibrationRequest: {
        type: 'JOG',
        inProgress: true,
        error: null,
        mount: 'right',
      },
    })
  })

  it('handles JOG response actions', () => {
    const state: RobotState = {
      calibration: {
        calibrationRequest: {
          type: 'JOG',
          inProgress: true,
          error: null,
          mount: 'right',
        },
      },
    } as any
    const success: Action = {
      type: 'robot:JOG_SUCCESS',
      payload: {},
    }
    const failure: Action = {
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

  it('handles UPDATE_OFFSET action', () => {
    const state: RobotState = {
      calibration: {
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error(),
        },
      },
    } as any
    const action: Action = {
      type: 'robot:UPDATE_OFFSET',
      payload: { mount: 'right', slot: '5' },
      meta: {} as any,
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

  it('handles UPDATE_OFFSET response actions', () => {
    const state: RobotState = {
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
    } as any

    const success: Action = {
      type: 'robot:UPDATE_OFFSET_SUCCESS',
      payload: {},
    }
    const failure: Action = {
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

  it('handles CONFIRM_LABWARE action', () => {
    const state: RobotState = {
      calibration: {
        confirmedBySlot: {},
      },
    } as any
    const action = {
      type: actionTypes.CONFIRM_LABWARE,
      payload: { labware: '5' },
    } as any

    expect(reducer(state, action).calibration).toEqual({
      confirmedBySlot: { 5: true },
    })
  })

  it('handles CLEAR_CALIBRATION_REQUEST and robot home actions', () => {
    const state: RobotState = {
      calibration: {
        calibrationRequest: {
          type: 'JOG',
          inProgress: true,
          error: null,
          mount: 'right',
        },
      },
    } as any
    const clearAction: Action = { type: 'robot:CLEAR_CALIBRATION_REQUEST' }
    expect(reducer(state, clearAction).calibration).toEqual({
      calibrationRequest: { type: '', inProgress: false, error: null },
    })

    const homeAction = { type: HOME } as any
    expect(reducer(state, homeAction).calibration).toEqual({
      calibrationRequest: { type: '', inProgress: false, error: null },
    })
  })

  it('handles RETURN_TIP action', () => {
    const state: RobotState = {
      calibration: {
        calibrationRequest: {
          type: '',
          inProgress: false,
          error: new Error(),
        },
      },
    } as any
    const action = {
      type: actionTypes.RETURN_TIP,
      payload: { mount: 'left' },
    } as any

    expect(reducer(state, action).calibration).toEqual({
      calibrationRequest: {
        type: 'RETURN_TIP',
        inProgress: true,
        error: null,
        mount: 'left',
      },
    })
  })

  it('handles RETURN_TIP_RESPONSE success', () => {
    const state: RobotState = {
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
    } as any
    const action = {
      type: actionTypes.RETURN_TIP_RESPONSE,
    } as any

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

  it('handles RETURN_TIP_RESPONSE failure', () => {
    const state: RobotState = {
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
    } as any
    const action = {
      type: actionTypes.RETURN_TIP_RESPONSE,
      error: true,
      payload: { message: 'AH' },
    } as any

    expect(reducer(state, action).calibration).toEqual({
      calibrationRequest: {
        type: 'RETURN_TIP',
        inProgress: false,
        error: { message: 'AH' },
        mount: 'left',
      },
      tipOnByMount: {
        left: false,
      },
    })
  })
})
