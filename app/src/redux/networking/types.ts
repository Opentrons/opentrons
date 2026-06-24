import type {
  RobotApiErrorResponse,
  RobotApiRequestMeta,
} from '../robot-api/types'
import type * as ApiTypes from './api-types'
import type {
  FETCH_EAP_OPTIONS,
  FETCH_EAP_OPTIONS_FAILURE,
  FETCH_EAP_OPTIONS_SUCCESS,
  FETCH_STATUS,
  FETCH_STATUS_FAILURE,
  FETCH_STATUS_SUCCESS,
  POST_WIFI_CONFIGURE,
  POST_WIFI_CONFIGURE_FAILURE,
  POST_WIFI_CONFIGURE_SUCCESS,
} from './constants'

export * from './api-types'

// fetch status

export interface FetchStatusAction {
  type: typeof FETCH_STATUS
  payload: { robotName: string }
  meta: RobotApiRequestMeta | {}
}

export interface FetchStatusSuccessAction {
  type: typeof FETCH_STATUS_SUCCESS
  payload: {
    robotName: string
    internetStatus: ApiTypes.InternetStatus
    interfaces: ApiTypes.InterfaceStatusMap
  }
  meta: RobotApiRequestMeta
}

export interface FetchStatusFailureAction {
  type: typeof FETCH_STATUS_FAILURE
  payload: { robotName: string; error: {} }
  meta: RobotApiRequestMeta
}

// connect to new network

export interface PostWifiConfigureAction {
  type: typeof POST_WIFI_CONFIGURE
  payload: { robotName: string; options: ApiTypes.WifiConfigureRequest }
  meta: RobotApiRequestMeta | {}
}

export interface PostWifiConfigureSuccessAction {
  type: typeof POST_WIFI_CONFIGURE_SUCCESS
  payload: { robotName: string; ssid: string }
  meta: RobotApiRequestMeta
}

export interface PostWifiConfigureFailureAction {
  type: typeof POST_WIFI_CONFIGURE_FAILURE
  payload: { robotName: string; error: RobotApiErrorResponse }
  meta: RobotApiRequestMeta
}

// fetch eap options

export interface FetchEapOptionsAction {
  type: typeof FETCH_EAP_OPTIONS
  payload: { robotName: string }
  meta: RobotApiRequestMeta | {}
}

export interface FetchEapOptionsSuccessAction {
  type: typeof FETCH_EAP_OPTIONS_SUCCESS
  payload: { robotName: string; eapOptions: ApiTypes.EapOption[] }
  meta: RobotApiRequestMeta
}

export interface FetchEapOptionsFailureAction {
  type: typeof FETCH_EAP_OPTIONS_FAILURE
  payload: { robotName: string; error: RobotApiErrorResponse }
  meta: RobotApiRequestMeta
}

export interface ClearWifiStatusAction {
  type: 'networking:CLEAR_WIFI_STATUS'
  payload: { robotName: string }
}

// action union

export type NetworkingAction =
  | FetchStatusAction
  | FetchStatusSuccessAction
  | FetchStatusFailureAction
  | PostWifiConfigureAction
  | PostWifiConfigureSuccessAction
  | PostWifiConfigureFailureAction
  | FetchEapOptionsAction
  | FetchEapOptionsSuccessAction
  | FetchEapOptionsFailureAction
  | ClearWifiStatusAction

// state types

export type PerRobotNetworkingState = Partial<{
  internetStatus?: ApiTypes.InternetStatus
  interfaces?: ApiTypes.InterfaceStatusMap
  wifiList?: ApiTypes.WifiNetwork[]
  eapOptions?: ApiTypes.EapOption[]
}>

export type NetworkingState = Partial<{
  [robotName: string]: null | undefined | PerRobotNetworkingState
}>

// selector types

export interface SimpleInterfaceStatus {
  ipAddress: string | null
  subnetMask: string | null
  macAddress: string
  type: ApiTypes.InterfaceType
}

export interface InterfaceStatusByType {
  wifi: SimpleInterfaceStatus | null
  ethernet: SimpleInterfaceStatus | null
}
