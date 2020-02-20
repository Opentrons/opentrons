// @flow
import { useState, useEffect, useRef } from 'react'
import find from 'lodash/find'

import {
  makeGetRobotWifiEapOptions,
  makeGetRobotWifiKeys,
  makeGetRobotWifiConfigure,
} from '../../../http-api-client'
import type { WifiNetworkList } from '../../../http-api-client'
import { getWifiList } from '../../../networking'

import type { ViewableRobot } from '../../../discovery/types'
import type { State } from '../../../types'

import { ACTIVE, CONNECT } from './constants'

const getActiveSsid = (list: WifiNetworkList) => {
  const activeNetwork = find(list, ACTIVE)
  return activeNetwork && activeNetwork.ssid
}

export const useStateRef = (list: WifiNetworkList) => {
  const [ssid, setSsid] = useState(getActiveSsid(list))
  const [previousSsid, setPreviousSsid] = useState(null)
  const [networkingType, setNetworkingType] = useState(CONNECT)
  const [securityType, setSecurityType] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const ssidRef = useRef(ssid)
  const previousSsidRef = useRef(previousSsid)
  const networkingTypeRef = useRef(networkingType)
  const securityTypeRef = useRef(securityType)

  useEffect(() => {
    ssidRef.current = ssid
    previousSsidRef.current = previousSsid
    networkingTypeRef.current = networkingType
    securityTypeRef.current = securityType
  }, [ssid, previousSsid, networkingType, securityType])

  return [
    ssid,
    setSsid,
    ssidRef,
    previousSsid,
    setPreviousSsid,
    previousSsidRef,
    networkingType,
    setNetworkingType,
    networkingTypeRef,
    securityType,
    setSecurityType,
    securityTypeRef,
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
