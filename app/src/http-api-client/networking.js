// @flow
// networking http api module
import {createSelector} from 'reselect'
import {buildRequestMaker, clearApiResponse} from './actions'
import {getRobotApiState} from './reducer'

import type {OutputSelector as Sel} from 'reselect'
import type {State} from '../types'
import type {BaseRobot} from '../robot'
import type {ApiCall} from './types'
import type {ApiAction} from './actions'

type NetworkingStatusPath = 'networking/status'
type WifiListPath = 'wifi/list'
type WifiConfigurePath = 'wifi/configure'

export type InternetStatus = 'none' | 'portal' | 'limited' | 'full' | 'unknown'

export type SecurityType = 'none' | 'wpa-psk' | 'wpa-eap'

export type NetworkInterface = {
  ipAddress: string,
  macAddress: string,
  gatewayAddress: string,
  state: string,
  type: 'wifi' | 'ethernet',
}

export type WifiNetwork = {
  ssid: string,
  signal: ?number,
  active: boolean,
  security: string,
  securityType: SecurityType,
}

export type WifiNetworkList = Array<WifiNetwork>

export type WifiListResponse = {list: WifiNetworkList}

export type NetworkingStatusResponse = {
  status: InternetStatus,
  interfaces: {[device: string]: NetworkInterface},
}

export type WifiConfigureRequest = {
  ssid: string,
  psk: string,
}

export type WifiConfigureResponse = {
  ssid: string,
  message: string,
}

export type NetworkingAction =
  | ApiAction<NetworkingStatusPath, void, NetworkingStatusResponse>
  | ApiAction<WifiListPath, void, WifiListResponse>
  | ApiAction<WifiConfigurePath, WifiConfigureRequest, WifiConfigureResponse>

export type FetchNetworkingStatusCall = ApiCall<void, NetworkingStatusResponse>
export type FetchWifiListCall = ApiCall<void, WifiListResponse>
export type ConfigureWifiCall = ApiCall<WifiConfigureRequest,
  WifiConfigureResponse>

export type RobotNetworkingState = {
  'networking/list'?: FetchNetworkingStatusCall,
  'wifi/list'?: FetchWifiListCall,
  'wifi/configure': ConfigureWifiCall,
}

const STATUS: NetworkingStatusPath = 'networking/status'
const LIST: WifiListPath = 'wifi/list'
const CONFIGURE: WifiConfigurePath = 'wifi/configure'

export const fetchNetworkingStatus = buildRequestMaker('GET', STATUS)
export const fetchWifiList = buildRequestMaker('GET', LIST)
export const configureWifi = buildRequestMaker('POST', CONFIGURE)
export const clearConfigureWifiResponse = (robot: BaseRobot) =>
  clearApiResponse(robot, CONFIGURE)

type GetNetworkingStatusCall = Sel<State, BaseRobot, FetchNetworkingStatusCall>
type GetWifiListCall = Sel<State, BaseRobot, FetchWifiListCall>
type GetConfigureWifiCall = Sel<State, BaseRobot, ConfigureWifiCall>

export const makeGetRobotNetworkingStatus = (): GetNetworkingStatusCall =>
  createSelector(
    getRobotApiState,
    state => state[STATUS] || {inProgress: false}
  )

export const makeGetRobotWifiList = (): GetWifiListCall =>
  createSelector(getRobotApiState, state => {
    const listCall = state[LIST] || {inProgress: false}
    if (!listCall.response) return listCall
    return {
      ...listCall,
      response: {
        ...listCall.response,
        list: dedupeNetworkList(listCall.response.list),
      },
    }
  })

export const makeGetRobotWifiConfigure = (): GetConfigureWifiCall =>
  createSelector(
    getRobotApiState,
    state => state[CONFIGURE] || {inProgress: false}
  )

function dedupeNetworkList (list: WifiNetworkList): WifiNetworkList {
  const {ids, networksById} = list.reduce(
    (result, network) => {
      const {ssid, active} = network

      if (!result.networksById[ssid]) {
        result.ids.push(ssid)
        result.networksById[ssid] = network
      } else if (active) {
        result.networksById[ssid].active = true
      }

      return result
    },
    {ids: [], networksById: {}}
  )

  return ids.map(ssid => networksById[ssid])
}
