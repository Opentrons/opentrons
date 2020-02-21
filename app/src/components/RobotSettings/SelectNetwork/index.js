// @flow
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import last from 'lodash/last'

import {
  useDispatchApiRequest,
  getRequestById,
  PENDING,
  SUCCESS,
  FAILURE,
} from '../../../robot-api'
import { postDisconnectNetwork, fetchWifiList } from '../../../networking'
import {
  NO_SECURITY,
  WPA_EAP_SECURITY,
  fetchWifiEapOptions,
  fetchWifiKeys,
  addWifiKey,
  configureWifi,
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

import {
  LIST_REFRESH_MS,
  DISCONNECT_WIFI_VALUE,
  JOIN_OTHER_VALUE,
  CONNECT,
  DISCONNECT,
  NETWORKING_TYPE,
} from './constants'

import { useStateSelectNetwork, stateSelector } from './hooks'
import { getSecurityType, hasSecurityType, formatLoaderMessage } from './utils'

// import type { State } from '../../../types'
// import type { RequestState } from '../../../robot-api/types'
import type { ViewableRobot } from '../../../discovery/types'
import type { PostDisconnectNetworkAction } from '../../../networking/types'

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
  } = useSelector(state => stateSelector(state, robot))

  const [
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
  ] = useStateSelectNetwork(list)

  const handleDisconnectWifiSuccess = useCallback(() => {
    setSsid(null)
    setPreviousSsid(null)
    setNetworkingType(CONNECT)
    setSecurityType(null)
  }, [setSsid, setPreviousSsid, setNetworkingType, setSecurityType])

  const handleDisconnectWifiFailure = useCallback(() => {
    console.log('Failed')
  }, [])

  const [
    dispatchApi,
    requestIds,
  ] = useDispatchApiRequest<PostDisconnectNetworkAction>()
  const disconnectRequestStatus = useSelector<State, RequestState | null>(
    state => getRequestById(state, last(requestIds))
  )?.status
  const pending = disconnectRequestStatus === PENDING

  React.useEffect(() => {
    if (disconnectRequestStatus === SUCCESS) {
      handleDisconnectWifiSuccess()
    }
    if (disconnectRequestStatus === FAILURE) {
      handleDisconnectWifiFailure()
    }
  }, [
    disconnectRequestStatus,
    handleDisconnectWifiSuccess,
    handleDisconnectWifiFailure,
  ])

  const dispatch = useDispatch()
  const dispatchRefresh = () => dispatch(fetchWifiList(robot.name))
  const dispatchConfigure = params => {
    return dispatch(
      chainActions(
        configureWifi(robot, params),
        startDiscovery(),
        fetchWifiList(robot.name)
      )
    )
  }

  const handleOnValueChange = (ssidValue: string) => {
    const isJoinOrDisconnect =
      ssidValue === JOIN_OTHER_VALUE || ssidValue === DISCONNECT_WIFI_VALUE

    const currentSsid = !isJoinOrDisconnect ? ssidValue : null
    const currentPreviousSsid = ssid
    const currentNetworkingType = NETWORKING_TYPE[ssidValue] || CONNECT
    const currentSecurityType = getSecurityType(list, ssidValue)
    const currentModalOpen = hasSecurityType(securityType, NO_SECURITY)

    const canFetchEapOptions =
      hasSecurityType(securityType, WPA_EAP_SECURITY) || !securityType
    if (currentModalOpen) {
      dispatch(dispatchConfigure({ ssid: ssidValue }))
    } else if (canFetchEapOptions) {
      dispatch(fetchWifiEapOptions(robot))
      dispatch(fetchWifiKeys(robot))
    }

    setSsid(currentSsid)
    setPreviousSsid(currentPreviousSsid)
    setNetworkingType(currentNetworkingType)
    setSecurityType(currentSecurityType)
    setModalOpen(!currentModalOpen)
  }

  const handleCancel = () => {
    setModalOpen(false)
  }

  const handleDisconnectWifi = () => {
    if (previousSsid) {
      dispatchApi(postDisconnectNetwork(robot.name, previousSsid))
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
        {connectingTo ||
          (pending && (
            <SpinnerModal
              message={formatLoaderMessage(connectingTo, ssid)}
              alertOverlay
            />
          ))}
        {modalOpen && (
          <ConnectModal
            ssid={ssid}
            previousSsid={previousSsid}
            networkingType={networkingType}
            securityType={securityType}
            close={handleCancel}
          >
            {networkingType === DISCONNECT ? (
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
                ssid={ssid}
                securityType={securityType}
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
