// @flow

import * as Constants from './constants'
import * as Types from './types'

import type { RobotApiRequestMeta } from '../robot-api/types'

export const fetchStatus = (robotName: string): Types.FetchStatusAction => ({
  type: Constants.FETCH_STATUS,
  payload: { robotName },
  meta: {},
})

export const fetchStatusSuccess = (
  robotName: string,
  internetStatus: Types.InternetStatus,
  interfaces: Types.InterfaceStatusMap,
  meta: RobotApiRequestMeta
): Types.FetchStatusSuccessAction => ({
  type: Constants.FETCH_STATUS_SUCCESS,
  payload: { robotName, internetStatus, interfaces },
  meta,
})

export const fetchStatusFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): Types.FetchStatusFailureAction => ({
  type: Constants.FETCH_STATUS_FAILURE,
  payload: { robotName, error },
  meta,
})
