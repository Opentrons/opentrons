// @flow
import { useState, useEffect } from 'react'

import {
  makeGetRobotWifiEapOptions,
  makeGetRobotWifiKeys,
  makeGetRobotWifiConfigure,
} from '../../../http-api-client'
import type { WifiNetworkList } from '../../../http-api-client'
import { getWifiList } from '../../../networking'

import type { ViewableRobot } from '../../../discovery/types'
import type { State } from '../../../types'

import { getActiveSsid, getSecurityType } from './utils'
import { CONNECT } from './constants'

export const useStateSelectNetwork = (list: WifiNetworkList) => {
  const activeSsid = getActiveSsid(list)
  const activeNetworkingType = activeSsid ? CONNECT : null
  const activeSecurityType = getSecurityType(list, activeSsid)

  const [ssid, setSsid] = useState(null)
  const [previousSsid, setPreviousSsid] = useState(null)
  const [networkingType, setNetworkingType] = useState(null)
  const [securityType, setSecurityType] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    setSsid(activeSsid)
    setNetworkingType(activeNetworkingType)
    setSecurityType(activeSecurityType)
  }, [activeSsid, activeNetworkingType, activeSecurityType])

  return [
    ssid,
    setSsid,
    previousSsid,
    setPreviousSsid,
    networkingType,
    setNetworkingType,
    securityType,
    setSecurityType,
    modalOpen,
    setModalOpen,
  ]
}

export const stateSelector = (state: State, robot: ViewableRobot) => {
  const getEapCall = makeGetRobotWifiEapOptions()
  const getKeysCall = makeGetRobotWifiKeys()
  const getConfigureCall = makeGetRobotWifiConfigure()
  const list = getWifiList(state, robot.name)

  const { response: eapResponse } = getEapCall(state, robot)
  const { response: keysResponse } = getKeysCall(state, robot)
  const {
    request: cfgRequest,
    inProgress: cfgInProgress,
    response: cfgResponse,
    error: cfgError,
  } = getConfigureCall(state, robot)

  return {
    list,
    eapOptions: eapResponse && eapResponse.options,
    keys: keysResponse && keysResponse.keys,
    connectingTo:
      !cfgError && cfgInProgress && cfgRequest ? cfgRequest.ssid : null,
    configRequest: cfgRequest,
    configResponse: cfgResponse,
    configError: cfgError,
  }
}
