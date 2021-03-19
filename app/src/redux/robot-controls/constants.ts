// @flow

// homing and move request targets

export const ROBOT: 'robot' = 'robot'
export const PIPETTE: 'pipette' = 'pipette'
export const MOUNT = 'mount'

// movement statuses

export const HOMING: 'homing' = 'homing'
export const HOME_ERROR: 'homeError' = 'homeError'
export const MOVING: 'moving' = 'moving'
export const MOVE_ERROR: 'moveError' = 'moveError'

// move positions
export const CHANGE_PIPETTE: 'changePipette' = 'changePipette'
export const ATTACH_TIP: 'attachTip' = 'attachTip'

// http paths

export const LIGHTS_PATH: '/robot/lights' = '/robot/lights'
export const HOME_PATH: '/robot/home' = '/robot/home'
export const POSITIONS_PATH: '/robot/positions' = '/robot/positions'
export const MOVE_PATH: '/robot/move' = '/robot/move'
export const DISENGAGE_MOTORS_PATH: '/motors/disengage' = '/motors/disengage'

// action type strings

export const FETCH_LIGHTS: 'robotControls:FETCH_LIGHTS' =
  'robotControls:FETCH_LIGHTS'

export const FETCH_LIGHTS_SUCCESS: 'robotControls:FETCH_LIGHTS_SUCCESS' =
  'robotControls:FETCH_LIGHTS_SUCCESS'

export const FETCH_LIGHTS_FAILURE: 'robotControls:FETCH_LIGHTS_FAILURE' =
  'robotControls:FETCH_LIGHTS_FAILURE'

export const UPDATE_LIGHTS: 'robotControls:UPDATE_LIGHTS' =
  'robotControls:UPDATE_LIGHTS'

export const UPDATE_LIGHTS_SUCCESS: 'robotControls:UPDATE_LIGHTS_SUCCESS' =
  'robotControls:UPDATE_LIGHTS_SUCCESS'

export const UPDATE_LIGHTS_FAILURE: 'robotControls:UPDATE_LIGHTS_FAILURE' =
  'robotControls:UPDATE_LIGHTS_FAILURE'

export const HOME: 'robotControls:HOME' = 'robotControls:HOME'

export const HOME_SUCCESS: 'robotControls:HOME_SUCCESS' =
  'robotControls:HOME_SUCCESS'

export const HOME_FAILURE: 'robotControls:HOME_FAILURE' =
  'robotControls:HOME_FAILURE'

export const MOVE: 'robotControls:MOVE' = 'robotControls:MOVE'

export const MOVE_SUCCESS: 'robotControls:MOVE_SUCCESS' =
  'robotControls:MOVE_SUCCESS'

export const MOVE_FAILURE: 'robotControls:MOVE_FAILURE' =
  'robotControls:MOVE_FAILURE'

export const CLEAR_MOVEMENT_STATUS: 'robotControls:CLEAR_MOVEMENT_STATUS' =
  'robotControls:CLEAR_MOVEMENT_STATUS'
