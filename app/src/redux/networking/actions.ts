// @flow

import * as Constants from './constants'
import * as Types from './types'

import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../robot-api/types'

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

export const fetchWifiList = (
  robotName: string
): Types.FetchWifiListAction => ({
  type: Constants.FETCH_WIFI_LIST,
  payload: { robotName },
  meta: {},
})

export const fetchWifiListSuccess = (
  robotName: string,
  wifiList: Array<Types.WifiNetwork>,
  meta: RobotApiRequestMeta
): Types.FetchWifiListSuccessAction => ({
  type: Constants.FETCH_WIFI_LIST_SUCCESS,
  payload: { robotName, wifiList },
  meta,
})

export const fetchWifiListFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.FetchWifiListFailureAction => ({
  type: Constants.FETCH_WIFI_LIST_FAILURE,
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

export const fetchWifiKeys = (
  robotName: string
): Types.FetchWifiKeysAction => ({
  type: Constants.FETCH_WIFI_KEYS,
  payload: { robotName },
  meta: {},
})

export const fetchWifiKeysSuccess = (
  robotName: string,
  wifiKeys: Array<Types.ApiWifiKey>,
  meta: RobotApiRequestMeta
): Types.FetchWifiKeysSuccessAction => ({
  type: Constants.FETCH_WIFI_KEYS_SUCCESS,
  payload: { robotName, wifiKeys },
  meta,
})

export const fetchWifiKeysFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.FetchWifiKeysFailureAction => ({
  type: Constants.FETCH_WIFI_KEYS_FAILURE,
  payload: { robotName, error },
  meta,
})

export const postWifiKeys = (
  robotName: string,
  keyFile: File
): Types.PostWifiKeysAction => ({
  type: Constants.POST_WIFI_KEYS,
  payload: { robotName, keyFile },
  meta: {},
})

export const postWifiKeysSuccess = (
  robotName: string,
  wifiKey: Types.ApiWifiKey,
  meta: RobotApiRequestMeta
): Types.PostWifiKeysSuccessAction => ({
  type: Constants.POST_WIFI_KEYS_SUCCESS,
  payload: { robotName, wifiKey },
  meta,
})

export const postWifiKeysFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.PostWifiKeysFailureAction => ({
  type: Constants.POST_WIFI_KEYS_FAILURE,
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
  eapOptions: Array<Types.EapOption>,
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

export const postWifiDisconnect = (
  robotName: string,
  ssid: string
): Types.PostWifiDisconnectAction => ({
  type: Constants.POST_WIFI_DISCONNECT,
  payload: { robotName, ssid },
  meta: {},
})

export const postWifiDisconnectSuccess = (
  robotName: string,
  meta: RobotApiRequestMeta
): Types.PostWifiDisconnectSuccessAction => ({
  type: Constants.POST_WIFI_DISCONNECT_SUCCESS,
  payload: { robotName },
  meta,
})

export const postWifiDisconnectFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.PostWifiDisconnectFailureAction => ({
  type: Constants.POST_WIFI_DISCONNECT_FAILURE,
  payload: { robotName, error },
  meta,
})
