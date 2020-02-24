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
  error: { ... },
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
  error: { ... },
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
  error: { ... },
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
  wifiKeys: Array<Types.WifiKey>,
  meta: RobotApiRequestMeta
): Types.FetchWifiKeysSuccessAction => ({
  type: Constants.FETCH_WIFI_KEYS_SUCCESS,
  payload: { robotName, wifiKeys },
  meta,
})

export const fetchWifiKeysFailure = (
  robotName: string,
  error: { ... },
  meta: RobotApiRequestMeta
): Types.FetchWifiKeysFailureAction => ({
  type: Constants.FETCH_WIFI_KEYS_FAILURE,
  payload: { robotName, error },
  meta,
})
