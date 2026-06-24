import * as Constants from './constants'

import type {
  RobotApiErrorResponse,
  RobotApiRequestMeta,
} from '../robot-api/types'
import type * as Types from './types'

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
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.FetchStatusFailureAction => ({
  type: Constants.FETCH_STATUS_FAILURE,
  payload: { robotName, error },
  meta,
})

export const postWifiConfigure = (
  robotName: string,
  options: Types.WifiConfigureRequest
): Types.PostWifiConfigureAction => ({
  type: Constants.POST_WIFI_CONFIGURE,
  payload: { robotName, options },
  meta: {},
})

export const postWifiConfigureSuccess = (
  robotName: string,
  ssid: string,
  meta: RobotApiRequestMeta
): Types.PostWifiConfigureSuccessAction => ({
  type: Constants.POST_WIFI_CONFIGURE_SUCCESS,
  payload: { robotName, ssid },
  meta,
})

export const postWifiConfigureFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.PostWifiConfigureFailureAction => ({
  type: Constants.POST_WIFI_CONFIGURE_FAILURE,
  payload: { robotName, error },
  meta,
})

export const fetchEapOptions = (
  robotName: string
): Types.FetchEapOptionsAction => ({
  type: Constants.FETCH_EAP_OPTIONS,
  payload: { robotName },
  meta: {},
})

export const fetchEapOptionsSuccess = (
  robotName: string,
  eapOptions: Types.EapOption[],
  meta: RobotApiRequestMeta
): Types.FetchEapOptionsSuccessAction => ({
  type: Constants.FETCH_EAP_OPTIONS_SUCCESS,
  payload: { robotName, eapOptions },
  meta,
})

export const fetchEapOptionsFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.FetchEapOptionsFailureAction => ({
  type: Constants.FETCH_EAP_OPTIONS_FAILURE,
  payload: { robotName, error },
  meta,
})

export const clearWifiStatus = (
  robotName: string
): Types.ClearWifiStatusAction => ({
  type: Constants.CLEAR_WIFI_STATUS,
  payload: { robotName },
})
