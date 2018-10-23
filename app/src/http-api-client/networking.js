// @flow
// networking http api module
import {createSelector} from 'reselect'
import orderBy from 'lodash/orderBy'
import partition from 'lodash/partition'
import uniqBy from 'lodash/uniqBy'

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
type WifiEapOptionsPath = 'wifi/eap-options'

export type InternetStatus = 'none' | 'portal' | 'limited' | 'full' | 'unknown'

export type WifiSecurityType = 'none' | 'wpa-psk' | 'wpa-eap'

export type NetworkInterface = {
  ipAddress: ?string,
  macAddress: string,
  gatewayAddress: ?string,
  state: string,
  type: 'wifi' | 'ethernet',
}

export type WifiNetwork = {
  ssid: string,
  signal: number,
  active: boolean,
  security: string,
  securityType: WifiSecurityType,
}

export type WifiNetworkList = Array<WifiNetwork>

export type WifiListResponse = {list: WifiNetworkList}

export type NetworkingStatusResponse = {
  status: InternetStatus,
  interfaces: {[device: string]: NetworkInterface},
}

export type WifiAuthField = {
  name: string,
  displayName: string,
  required: boolean,
  type: 'string' | 'password' | 'file',
}

export type WifiEapOption = {
  name: string,
  displayName: string,
  options: Array<WifiAuthField>,
}

export type WifiEapOptionsList = Array<WifiEapOption>

export type WifiEapOptionsResponse = {
  options: WifiEapOptionsList,
}

export type WifiConfigureRequest = {
  ssid: string,
  psk?: string,
  securityType?: WifiSecurityType,
  hidden?: boolean,
  eapConfig?: {
    method: string,
    [eapOption: string]: string,
  },
}

export type WifiConfigureResponse = {
  ssid: string,
  message: string,
}

export type NetworkingAction =
  | ApiAction<NetworkingStatusPath, void, NetworkingStatusResponse>
  | ApiAction<WifiListPath, void, WifiListResponse>
  | ApiAction<WifiEapOptionsPath, void, WifiEapOptionsResponse>
  | ApiAction<WifiConfigurePath, WifiConfigureRequest, WifiConfigureResponse>

export type FetchNetworkingStatusCall = ApiCall<void, NetworkingStatusResponse>
export type FetchWifiListCall = ApiCall<void, WifiListResponse>
export type FetchWifiEapOptionsCall = ApiCall<void, WifiEapOptionsResponse>
export type ConfigureWifiCall = ApiCall<WifiConfigureRequest,
  WifiConfigureResponse>

export type NetworkingState = {|
  'networking/list'?: FetchNetworkingStatusCall,
  'wifi/list'?: FetchWifiListCall,
  'wifi/eap-options'?: FetchWifiEapOptionsCall,
  'wifi/configure': ConfigureWifiCall,
|}

const STATUS: NetworkingStatusPath = 'networking/status'
const LIST: WifiListPath = 'wifi/list'
const EAP_OPTIONS: WifiEapOptionsPath = 'wifi/eap-options'
const CONFIGURE: WifiConfigurePath = 'wifi/configure'

export const NO_SECURITY: 'none' = 'none'
export const WPA_PSK_SECURITY: 'wpa-psk' = 'wpa-psk'
export const WPA_EAP_SECURITY: 'wpa-eap' = 'wpa-eap'

export const fetchNetworkingStatus = buildRequestMaker('GET', STATUS)
export const fetchWifiList = buildRequestMaker('GET', LIST)
export const fetchWifiEapOptions = buildRequestMaker('GET', EAP_OPTIONS)
export const configureWifi = buildRequestMaker('POST', CONFIGURE)
export const clearConfigureWifiResponse = (robot: BaseRobot) =>
  clearApiResponse(robot, CONFIGURE)

type GetNetworkingStatusCall = Sel<State, BaseRobot, FetchNetworkingStatusCall>
type GetWifiListCall = Sel<State, BaseRobot, FetchWifiListCall>
type GetWifiEapOptionsCall = Sel<State, BaseRobot, FetchWifiEapOptionsCall>
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

export const makeGetRobotWifiEapOptions = (): GetWifiEapOptionsCall =>
  createSelector(getRobotApiState, state => {
    const call = state[EAP_OPTIONS] || {inProgress: true}
    if (!call.response) return call
    return {
      ...call,
      response: {
        ...call.response,
        options: sortEapOptions(call.response.options),
      },
    }
  })

export const makeGetRobotWifiConfigure = (): GetConfigureWifiCall =>
  createSelector(
    getRobotApiState,
    state => state[CONFIGURE] || {inProgress: false}
  )

const LIST_ORDER = [['active', 'ssid', 'signal'], ['desc', 'asc', 'desc']]

function dedupeNetworkList (list: WifiNetworkList): WifiNetworkList {
  const sortedList = orderBy(list, ...LIST_ORDER)
  return uniqBy(sortedList, 'ssid')
}

function sortEapOptions (list: WifiEapOptionsList): WifiEapOptionsList {
  return list.map(eapOption => {
    const [required, optional] = partition(eapOption.options, 'required')
    // place any matching (starts with the same name) optional fields directly
    // after their "parent" required field
    const requiredWithMatching = required.reduce((result, field) => {
      result.push(field)
      result.push(...optional.filter(f => f.name.startsWith(field.name)))
      return result
    }, [])
    const options = uniqBy(requiredWithMatching.concat(optional), 'name')

    return {...eapOption, options}
  })
}
