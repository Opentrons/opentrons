// @flow

// homing targets

export const ROBOT: 'robot' = 'robot'
export const PIPETTE: 'pipette' = 'pipette'

// movement statuses

export const HOMING: 'homing' = 'homing'
export const HOME_ERROR: 'home-error' = 'home-error'
export const MOVING: 'moving' = 'moving'
export const MOVE_ERROR: 'move-error' = 'move-error'

// http paths

export const LIGHTS_PATH: '/robot/lights' = '/robot/lights'
export const HOME_PATH: '/robot/home' = '/robot/home'

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

export const CLEAR_MOVEMENT_STATUS: 'robotControls:CLEAR_MOVEMENT_STATUS' =
  'robotControls:CLEAR_MOVEMENT_STATUS'
