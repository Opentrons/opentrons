// @flow
// domain layer constants

export const CREATE_ROBOT_CALIBRATION_CHECK_SESSION: 'calibration:CREATE_ROBOT_CALIBRATION_CHECK_SESSION' =
  'calibration:CREATE_ROBOT_CALIBRATION_CHECK_SESSION'

export const CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS: 'calibration:CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS' =
  'calibration:CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS'

export const CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE: 'calibration:CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE' =
  'calibration:CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE'

export const FETCH_ROBOT_CALIBRATION_CHECK_SESSION: 'calibration:FETCH_ROBOT_CALIBRATION_CHECK_SESSION' =
  'calibration:FETCH_ROBOT_CALIBRATION_CHECK_SESSION'

export const FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS: 'calibration:FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS' =
  'calibration:FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS'

export const FETCH_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE: 'calibration:FETCH_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE' =
  'calibration:FETCH_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE'

export const ROBOT_CALIBRATION_CHECK_LOAD_LABWARE: 'calibration:ROBOT_CALIBRATION_CHECK_LOAD_LABWARE' =
  'calibration:ROBOT_CALIBRATION_CHECK_LOAD_LABWARE'

export const ROBOT_CALIBRATION_CHECK_PREPARE_PIPETTE: 'calibration:ROBOT_CALIBRATION_CHECK_PREPARE_PIPETTE' =
  'calibration:ROBOT_CALIBRATION_CHECK_PREPARE_PIPETTE'

export const ROBOT_CALIBRATION_CHECK_JOG: 'calibration:ROBOT_CALIBRATION_CHECK_JOG' =
  'calibration:ROBOT_CALIBRATION_CHECK_JOG'

export const ROBOT_CALIBRATION_CHECK_PICK_UP_TIP: 'calibration:ROBOT_CALIBRATION_CHECK_PICK_UP_TIP' =
  'calibration:ROBOT_CALIBRATION_CHECK_PICK_UP_TIP'

export const ROBOT_CALIBRATION_CHECK_CONFIRM_TIP: 'calibration:ROBOT_CALIBRATION_CHECK_CONFIRM_TIP' =
  'calibration:ROBOT_CALIBRATION_CHECK_CONFIRM_TIP'

export const ROBOT_CALIBRATION_CHECK_COMPARE_POINT: 'calibration:ROBOT_CALIBRATION_CHECK_COMPARE_POINT' =
  'calibration:ROBOT_CALIBRATION_CHECK_COMPARE_POINT'

export const ROBOT_CALIBRATION_CHECK_CONFIRM_STEP: 'calibration:ROBOT_CALIBRATION_CHECK_CONFIRM_STEP' =
  'calibration:ROBOT_CALIBRATION_CHECK_CONFIRM_STEP'

export const ROBOT_CALIBRATION_CHECK_INVALIDATE_TIP: 'calibration:ROBOT_CALIBRATION_CHECK_INVALIDATE_TIP' =
  'calibration:ROBOT_CALIBRATION_CHECK_INVALIDATE_TIP'

export const UPDATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS: 'calibration:UPDATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS' =
  'calibration:UPDATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS'

export const UPDATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE: 'calibration:UPDATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE' =
  'calibration:UPDATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE'

export const DELETE_ROBOT_CALIBRATION_CHECK_SESSION: 'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION' =
  'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION'

export const DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS: 'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS' =
  'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS'

export const DELETE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE: 'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE' =
  'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE'

export const COMPLETE_ROBOT_CALIBRATION_CHECK: 'calibration:COMPLETE_ROBOT_CALIBRATION_CHECK' =
  'calibration:COMPLETE_ROBOT_CALIBRATION_CHECK'

// api constants

export const ROBOT_CALIBRATION_CHECK_PATH: '/calibration/check/session' =
  '/calibration/check/session'

export const CHECK_STEP_SESSION_STARTED: 'sessionStarted' = 'sessionStarted'
export const CHECK_STEP_LABWARE_LOADED: 'labwareLoaded' = 'labwareLoaded'
export const CHECK_STEP_PREPARING_FIRST_PIPETTE: 'preparingFirstPipette' =
  'preparingFirstPipette'
export const CHECK_STEP_INSPECTING_FIRST_TIP: 'inspectingFirstTip' =
  'inspectingFirstTip'
export const CHECK_STEP_JOGGING_FIRST_PIPETTE_HEIGHT: 'joggingFirstPipetteToHeight' =
  'joggingFirstPipetteToHeight'
export const CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT: 'comparingFirstPipetteHeight' =
  'comparingFirstPipetteHeight'
export const CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE: 'joggingFirstPipetteToPointOne' =
  'joggingFirstPipetteToPointOne'
export const CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE: 'comparingFirstPipettePointOne' =
  'comparingFirstPipettePointOne'
export const CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO: 'joggingFirstPipetteToPointTwo' =
  'joggingFirstPipetteToPointTwo'
export const CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO: 'comparingFirstPipettePointTwo' =
  'comparingFirstPipettePointTwo'
export const CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE: 'joggingFirstPipetteToPointThree' =
  'joggingFirstPipetteToPointThree'
export const CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE: 'comparingFirstPipettePointThree' =
  'comparingFirstPipettePointThree'
export const CHECK_STEP_PREPARING_SECOND_PIPETTE: 'preparingSecondPipette' =
  'preparingSecondPipette'
export const CHECK_STEP_INSPECTING_SECOND_TIP: 'inspectingSecondTip' =
  'inspectingSecondTip'
export const CHECK_STEP_JOGGING_SECOND_PIPETTE_HEIGHT: 'joggingSecondPipetteToHeight' =
  'joggingSecondPipetteToHeight'
export const CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT: 'comparingSecondPipetteHeight' =
  'comparingSecondPipetteHeight'
export const CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE: 'joggingSecondPipetteToPointOne' =
  'joggingSecondPipetteToPointOne'
export const CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE: 'comparingSecondPipettePointOne' =
  'comparingSecondPipettePointOne'
export const CHECK_STEP_SESSION_EXITED: 'sessionExited' = 'sessionExited'
export const CHECK_STEP_BAD_ROBOT_CALIBRATION: 'badRobotCalibration' =
  'badRobotCalibration'
export const CHECK_STEP_NO_PIPETTES_ATTACHED: 'noPipettesAttached' =
  'noPipettesAttached'

export const CHECK_UPDATE_PATH_LOAD_LABWARE: 'loadLabware' = 'loadLabware'
export const CHECK_UPDATE_PATH_PREPARE_PIPETTE: 'preparePipette' =
  'preparePipette'
export const CHECK_UPDATE_PATH_JOG: 'jog' = 'jog'
export const CHECK_UPDATE_PATH_PICK_UP_TIP: 'pickUpTip' = 'pickUpTip'
export const CHECK_UPDATE_PATH_CONFIRM_TIP: 'confirmTip' = 'confirmTip'
export const CHECK_UPDATE_PATH_INVALIDATE_TIP: 'invalidateTip' = 'invalidateTip'
export const CHECK_UPDATE_PATH_CHECK_POINT_ONE: 'checkPointOne' =
  'checkPointOne'
export const CHECK_UPDATE_PATH_CHECK_POINT_TWO: 'checkPointTwo' =
  'checkPointTwo'
export const CHECK_UPDATE_PATH_CHECK_POINT_THREE: 'checkPointThree' =
  'checkPointThree'
export const CHECK_UPDATE_PATH_CHECK_HEIGHT: 'checkHeight' = 'checkHeight'
export const CHECK_UPDATE_PATH_COMPARE_POINT: 'comparePoint' = 'comparePoint'
export const CHECK_UPDATE_PATH_CONFIRM_STEP: 'confirmStep' = 'confirmStep'
