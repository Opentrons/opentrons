// @flow

export * from './calibration-check/constants'
export * from './tip-length-calibration/constants'
export * from './deck-calibration/constants'
export * from './pipette-offset-calibration/constants'
export * from './common-calibration/constants'

export const SESSIONS_PATH: '/sessions' = '/sessions'

export const SESSIONS_COMMANDS_PATH_EXTENSION: '/commands' = '/commands'

export const SESSIONS_COMMANDS_EXECUTE_PATH_EXTENSION: '/commands/execute' =
  '/commands/execute'

export const CREATE_SESSION: 'sessions:CREATE_SESSION' =
  'sessions:CREATE_SESSION'

export const CREATE_SESSION_SUCCESS: 'sessions:CREATE_SESSION_SUCCESS' =
  'sessions:CREATE_SESSION_SUCCESS'

export const CREATE_SESSION_FAILURE: 'sessions:CREATE_SESSION_FAILURE' =
  'sessions:CREATE_SESSION_FAILURE'

export const DELETE_SESSION: 'sessions:DELETE_SESSION' =
  'sessions:DELETE_SESSION'

export const DELETE_SESSION_SUCCESS: 'sessions:DELETE_SESSION_SUCCESS' =
  'sessions:DELETE_SESSION_SUCCESS'

export const DELETE_SESSION_FAILURE: 'sessions:DELETE_SESSION_FAILURE' =
  'sessions:DELETE_SESSION_FAILURE'

export const FETCH_SESSION: 'sessions:FETCH_SESSION' = 'sessions:FETCH_SESSION'

export const FETCH_SESSION_SUCCESS: 'sessions:FETCH_SESSION_SUCCESS' =
  'sessions:FETCH_SESSION_SUCCESS'

export const FETCH_SESSION_FAILURE: 'sessions:FETCH_SESSION_FAILURE' =
  'sessions:FETCH_SESSION_FAILURE'

export const FETCH_ALL_SESSIONS: 'sessions:FETCH_ALL_SESSIONS' =
  'sessions:FETCH_ALL_SESSIONS'

export const FETCH_ALL_SESSIONS_SUCCESS: 'sessions:FETCH_ALL_SESSIONS_SUCCESS' =
  'sessions:FETCH_ALL_SESSIONS_SUCCESS'

export const FETCH_ALL_SESSIONS_FAILURE: 'sessions:FETCH_ALL_SESSIONS_FAILURE' =
  'sessions:FETCH_ALL_SESSIONS_FAILURE'

export const ENSURE_SESSION: 'sessions:ENSURE_SESSION' =
  'sessions:ENSURE_SESSION'

export const CREATE_SESSION_COMMAND: 'sessions:CREATE_SESSION_COMMAND' =
  'sessions:CREATE_SESSION_COMMAND'

export const CREATE_SESSION_COMMAND_SUCCESS: 'sessions:CREATE_SESSION_COMMAND_SUCCESS' =
  'sessions:CREATE_SESSION_COMMAND_SUCCESS'

export const CREATE_SESSION_COMMAND_FAILURE: 'sessions:CREATE_SESSION_COMMAND_FAILURE' =
  'sessions:CREATE_SESSION_COMMAND_FAILURE'

export const SESSION_TYPE_CALIBRATION_CHECK: 'calibrationCheck' =
  'calibrationCheck'
export const SESSION_TYPE_TIP_LENGTH_CALIBRATION: 'tipLengthCalibration' =
  'tipLengthCalibration'
export const SESSION_TYPE_DECK_CALIBRATION: 'deckCalibration' =
  'deckCalibration'
export const SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION: 'pipetteOffsetCalibration' =
  'pipetteOffsetCalibration'
