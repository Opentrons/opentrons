// @flow
import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import find from 'lodash/find'
// import last from 'lodash/last'

import {
  useDispatchApiRequest,
  // getRequestById,
  // PENDING,
  // SUCCESS,
} from '../../../robot-api'
import { postDisconnectNetwork } from '../../../networking'
import {
  NO_SECURITY,
  WPA_EAP_SECURITY,
  fetchWifiList,
  fetchWifiEapOptions,
  fetchWifiKeys,
  addWifiKey,
  configureWifi,
  makeGetRobotWifiList,
  makeGetRobotWifiEapOptions,
  makeGetRobotWifiKeys,
  makeGetRobotWifiConfigure,
  clearConfigureWifiResponse,
} from '../../../http-api-client'

import { startDiscovery } from '../../../discovery'
import { chainActions } from '../../../util'

import { IntervalWrapper, SpinnerModal } from '@opentrons/components'
import { Portal } from '../../portal'
import { BottomButtonBar } from '../../modals'
import { ConnectModal } from './ConnectModal'
import { ConnectForm } from './ConnectForm'
import { SelectSsid } from './SelectSsid'
import { WifiConnectModal } from './WifiConnectModal'

import { DISCONNECT_WIFI_VALUE, JOIN_OTHER_VALUE } from './constants'

// import type { State } from '../../../types'
// import type { RequestState } from '../../../robot-api/types'
import type { ViewableRobot } from '../../../discovery/types'
import type { PostDisconnectNetworkAction } from '../../../networking/types'

const CONNECT = 'connect'
const DISCONNECT = 'disconnect'
const JOIN = 'join'
const LIST_REFRESH_MS = 15000

const hasSecurityType = (securityType: ?string, securityValue: string) =>
  securityType === securityValue

const networkingTypeTable = {
  [DISCONNECT_WIFI_VALUE]: DISCONNECT,
  [JOIN_OTHER_VALUE]: JOIN,
}

type Props = {| robot: ViewableRobot |}

export const SelectNetwork = ({ robot }: Props) => {
  const {
    list,
    eapOptions,
    keys,
    connectingTo,
    configRequest,
    configResponse,
    configError,
  } = useSelector(state => {
    const getListCall = makeGetRobotWifiList()
    const getEapCall = makeGetRobotWifiEapOptions()
    const getKeysCall = makeGetRobotWifiKeys()
    const getConfigureCall = makeGetRobotWifiConfigure()

    const { response: listResponse } = getListCall(state, robot)
    const { response: eapResponse } = getEapCall(state, robot)
    const { response: keysResponse } = getKeysCall(state, robot)
    const {
      request: cfgRequest,
      inProgress: cfgInProgress,
      response: cfgResponse,
      error: cfgError,
    } = getConfigureCall(state, robot)

    return {
      list: listResponse && listResponse.list,
      eapOptions: eapResponse && eapResponse.options,
      keys: keysResponse && keysResponse.keys,
      connectingTo:
        !cfgError && cfgInProgress && cfgRequest ? cfgRequest.ssid : null,
      configRequest: cfgRequest,
      configResponse: cfgResponse,
      configError: cfgError,
    }
  })

  const [
    dispatchApi,
    // requestIds,
  ] = useDispatchApiRequest<PostDisconnectNetworkAction>()
  // const requestStatus = useSelector<State, RequestState | null>(state =>
  //   getRequestById(state, last(requestIds))
  // )?.status
  // // const showSpinner = requestStatus === PENDING

  // // React.useEffect(() => {
  // //   if (requestStatus === SUCCESS) {}
  // // }, [requestStatus])

  const dispatch = useDispatch()
  const dispatchRefresh = () => [fetchWifiList(robot)].forEach(dispatch)
  const dispatchConfigure = params => {
    const refreshActions = [fetchWifiList(robot)]
    return dispatch(
      chainActions(
        configureWifi(robot, params),
        startDiscovery(),
        ...refreshActions
      )
    )
  }

  const useStateRef = () => {
    const activeNetwork = find(list, 'active')
    const ssidValue = activeNetwork && activeNetwork.ssid
    const [ssid, setSsid] = useState(ssidValue)
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

  const [
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
  ] = useStateRef()

  const handleOnValueChange = (ssidValue: string) => {
    const previousSsidValue = ssid
    const isJoinOrDisconnect =
      ssidValue === JOIN_OTHER_VALUE || ssidValue === DISCONNECT_WIFI_VALUE
    const networkingTypeValue = networkingTypeTable[ssidValue] || networkingType

    const network = find(list, { ssidValue })
    const securityTypeValue = network?.securityType

    const modalOpenValue = !hasSecurityType(securityType, NO_SECURITY)
    const canFetchEapOptions =
      hasSecurityType(securityType, WPA_EAP_SECURITY) || !securityType

    if (!modalOpenValue) {
      dispatch(dispatchConfigure({ ssid: ssidValue }))
    } else if (canFetchEapOptions) {
      dispatch(fetchWifiEapOptions(robot))
      dispatch(fetchWifiKeys(robot))
    }

    setSsid(!isJoinOrDisconnect ? ssidValue : null)
    setPreviousSsid(previousSsidValue)
    setSecurityType(securityTypeValue)
    setNetworkingType(networkingTypeValue)
    setModalOpen(modalOpenValue)
  }

  const handleCancel = () => {
    setSsid(previousSsid)
    setPreviousSsid(null)
    setModalOpen(false)
  }

  const handleDisconnectWifi = () => {
    const robotName = robot && robot?.displayName

    if (robotName && previousSsid) {
      dispatchApi(postDisconnectNetwork(robotName, previousSsid))
      setModalOpen(false)
    }
  }

  return (
    <IntervalWrapper refresh={dispatchRefresh} interval={LIST_REFRESH_MS}>
      <SelectSsid
        list={list || []}
        disabled={connectingTo != null}
        handleOnValueChange={handleOnValueChange}
      />
      <Portal>
        {connectingTo && (
          <SpinnerModal
            message={`Attempting to connect to network ${connectingTo}`}
            alertOverlay
          />
        )}
        {modalOpen && (
          <ConnectModal
            ssid={ssidRef.current}
            previousSsid={previousSsidRef.current}
            networkingType={networkingTypeRef.current}
            securityType={securityTypeRef.current}
            close={handleCancel}
          >
            {networkingTypeRef.current === DISCONNECT ? (
              <BottomButtonBar
                buttons={[
                  { children: 'Cancel', onClick: handleCancel },
                  {
                    children: 'Disconnect',
                    onClick: handleDisconnectWifi,
                  },
                ]}
              />
            ) : (
              <ConnectForm
                ssid={ssidRef.current}
                securityType={securityTypeRef.current}
                eapOptions={eapOptions}
                keys={keys}
                configure={dispatchConfigure}
                close={handleCancel}
                addKey={file => dispatch(addWifiKey(robot, file))}
              />
            )}
          </ConnectModal>
        )}
        {configRequest && !!(configError || configResponse) && (
          <WifiConnectModal
            error={configError}
            request={configRequest}
            response={configResponse}
            close={dispatch(clearConfigureWifiResponse(robot))}
          />
        )}
      </Portal>
    </IntervalWrapper>
  )
}
