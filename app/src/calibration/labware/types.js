// @flow

import type {
    RobotApiRequestMeta,
    RobotApiErrorResponse,
  } from '../robot-api/types'
  
  import type { CalibrationStatus } from './types'
  
  import typeof {
    FETCH_CALIBRATION_STATUS,
    FETCH_CALIBRATION_STATUS_SUCCESS,
    FETCH_CALIBRATION_STATUS_FAILURE,
  } from './constants'
  
  export * from './api-types'


export type FetchLabwareCalibrationAction = {|
    type: FETCH_CALIBRATION_STATUS,
    payload: {| robotName: string |},
    meta: RobotApiRequestMeta,
  |}
  