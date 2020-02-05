// @flow
// networking http api module
import { createSelector } from 'reselect'
import orderBy from 'lodash/orderBy'
import partition from 'lodash/partition'
import uniqBy from 'lodash/uniqBy'

import {
  apiRequest,
  apiSuccess,
  apiFailure,
  buildRequestMaker,
  clearApiResponse,
} from './actions'
import { getRobotApiState } from './reducer'
import client from './client'

import type { OutputSelector as Sel } from 'reselect'
import type { State, ThunkPromiseAction } from '../types'
import type { BaseRobot } from '../robot/types'
import type { ViewableRobot } from '../discovery/types'
import type { ApiCall } from './types'
import type { ApiAction } from './actions'

type WifiListPath = 'wifi/list'
type WifiConfigurePath = 'wifi/configure'
type WifiEapOptionsPath = 'wifi/eap-options'
type WifiKeysPath = 'wifi/keys'

export type WifiSecurityType = 'none' | 'wpa-psk' | 'wpa-eap'

export type WifiNetwork = {
  ssid: string,
  signal: number,
  active: boolean,
  security: string,
  securityType: WifiSecurityType,
}

export type WifiNetworkList = Array<WifiNetwork>

export type WifiListResponse = { list: WifiNetworkList }

export type WifiAuthField = {
  name: string,
  displayName: string,
  required: boolean,
  type: 'string' | 'password' | 'file',
}

export type WifiEapOption = {
  name: string,
  // API <= 3.4.0 does not include displayName in response
  displayName?: string,
  options: Array<WifiAuthField>,
}

export type WifiEapOptionsList = Array<WifiEapOption>

export type WifiEapOptionsResponse = {
  options: WifiEapOptionsList,
}

export type WifiKey = {
  id: string,
  uir: string,
  name: string,
}

export type WifiKeysList = Array<WifiKey>

export type WifiKeysRequest = ?{ key: string }

export type WifiKeysResponse = { keys: WifiKeysList }

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
  | ApiAction<WifiListPath, void, WifiListResponse>
  | ApiAction<WifiEapOptionsPath, void, WifiEapOptionsResponse>
  | ApiAction<WifiKeysPath, WifiKeysRequest, WifiKeysResponse>
  | ApiAction<WifiConfigurePath, WifiConfigureRequest, WifiConfigureResponse>

export type FetchWifiListCall = ApiCall<void, WifiListResponse>
export type FetchWifiEapOptionsCall = ApiCall<void, WifiEapOptionsResponse>
export type FetchWifiKeysCall = ApiCall<WifiKeysRequest, WifiKeysResponse>
export type ConfigureWifiCall = ApiCall<
  WifiConfigureRequest,
  WifiConfigureResponse
>

export type NetworkingState = {|
  'wifi/list'?: FetchWifiListCall,
  'wifi/eap-options'?: FetchWifiEapOptionsCall,
  'wifi/keys'?: FetchWifiKeysCall,
  'wifi/configure': ConfigureWifiCall,
|}

const LIST: WifiListPath = 'wifi/list'
const EAP_OPTIONS: WifiEapOptionsPath = 'wifi/eap-options'
const KEYS: WifiKeysPath = 'wifi/keys'
const CONFIGURE: WifiConfigurePath = 'wifi/configure'

export const NO_SECURITY: 'none' = 'none'
export const WPA_PSK_SECURITY: 'wpa-psk' = 'wpa-psk'
export const WPA_EAP_SECURITY: 'wpa-eap' = 'wpa-eap'

export const SSID_FIELD = 'ssid'
export const PSK_FIELD = 'psk'
export const SECURITY_TYPE_FIELD = 'securityType'
export const EAP_CONFIG_FIELD = 'eapConfig'
export const EAP_TYPE_FIELD = `${EAP_CONFIG_FIELD}.eapType`

export const fetchWifiList = buildRequestMaker<void>('GET', LIST)
export const fetchWifiEapOptions = buildRequestMaker<void>('GET', EAP_OPTIONS)
export const fetchWifiKeys = buildRequestMaker<void>('GET', KEYS)
export const configureWifi = buildRequestMaker<WifiConfigureRequest>(
  'POST',
  CONFIGURE
)
export const clearConfigureWifiResponse = (robot: BaseRobot) =>
  clearApiResponse<WifiConfigurePath>(robot, CONFIGURE)

// slightly custom action creator to call `POST /wifi/keys` (see TODO below)
export function addWifiKey(
  robot: ViewableRobot,
  file: File
): ThunkPromiseAction {
  return dispatch => {
    // $FlowFixMe: (mc, 2019-04-18) http-api-client types need to be redone
    dispatch(apiRequest(robot, KEYS, { key: file.name }))

    const request = new FormData()
    request.append('key', file)

    const result = client(robot, 'POST', KEYS, request)

    return result.then(
      response => {
        // TODO(mc, 2019-10-23): re-getting the whole list after this POST
        // (which properly returns an individual item) is an inelgant solution
        // to maintain the full list of ID'd resources in state. It's probably
        // time to pull in a redux API library to maintain this state instead
        dispatch(fetchWifiKeys(robot))
        // HACK(mc, 2018-02-22): return a fake API success _only for the
        // action caller_ so that is knows the ID of the key it just uploaded
        // See todo above about this state management not scaling
        // $FlowFixMe: see above
        return apiSuccess(robot, KEYS, response)
      },
      // $FlowFixMe: (mc, 2019-04-18) http-api-client types need to be redone
      error => dispatch(apiFailure(robot, KEYS, error))
    )
  }
}

type GetWifiListCall = Sel<State, BaseRobot, FetchWifiListCall>
type GetWifiEapOptionsCall = Sel<State, BaseRobot, FetchWifiEapOptionsCall>
type GetWifiKeysCall = Sel<State, BaseRobot, FetchWifiKeysCall>
type GetConfigureWifiCall = Sel<State, BaseRobot, ConfigureWifiCall>

export const makeGetRobotWifiList = (): GetWifiListCall =>
  createSelector(
    getRobotApiState,
    state => {
      const listCall = state[LIST] || { inProgress: false }
      if (!listCall.response) return listCall
      return {
        ...listCall,
        response: {
          ...listCall.response,
          list: dedupeNetworkList(listCall.response.list),
        },
      }
    }
  )

export const makeGetRobotWifiEapOptions = (): GetWifiEapOptionsCall =>
  createSelector(
    getRobotApiState,
    state => {
      const call = state[EAP_OPTIONS] || { inProgress: false }
      if (!call.response) return call
      return {
        ...call,
        response: {
          ...call.response,
          options: sortEapOptions(call.response.options),
        },
      }
    }
  )

export const makeGetRobotWifiKeys = (): GetWifiKeysCall =>
  createSelector(
    getRobotApiState,
    state => {
      const call = state[KEYS] || { inProgress: false }
      if (!call.response) return call
      // re-format incorrect response from version <= 3.4
      const response = Array.isArray(call.response)
        ? { keys: call.response }
        : call.response

      return { ...call, response }
    }
  )

export const makeGetRobotWifiConfigure = (): GetConfigureWifiCall =>
  createSelector(
    getRobotApiState,
    state => state[CONFIGURE] || { inProgress: false }
  )

const LIST_ORDER = [['active', 'ssid', 'signal'], ['desc', 'asc', 'desc']]

function dedupeNetworkList(list: WifiNetworkList): WifiNetworkList {
  const sortedList = orderBy(list, ...LIST_ORDER)
  return uniqBy(sortedList, 'ssid')
}

function sortEapOptions(list: WifiEapOptionsList): WifiEapOptionsList {
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

    return { ...eapOption, options }
  })
}
