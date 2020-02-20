// @flow
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
// import last from 'lodash/last'

import {
  useDispatchApiRequest,
  // getRequestById,
  // PENDING,
  // SUCCESS,
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
  DISCONNECT_WIFI_VALUE,
  JOIN_OTHER_VALUE,
  CONNECT,
  DISCONNECT,
  JOIN,
} from './constants'

import { useStateSelectNetwork, stateSelector } from './hooks'
import { getSecurityType, hasSecurityType } from './utils'

// import type { State } from '../../../types'
// import type { RequestState } from '../../../robot-api/types'
import type { ViewableRobot } from '../../../discovery/types'
import type { PostDisconnectNetworkAction } from '../../../networking/types'

const LIST_REFRESH_MS = 15000

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
  } = useSelector(state => stateSelector(state, robot))

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
  const dispatchRefresh = () => dispatchApi(fetchWifiList(robot.name))

  const dispatch = useDispatch()
  const dispatchConfigure = params => {
    return dispatch(
      chainActions(
        configureWifi(robot, params),
        startDiscovery(),
        fetchWifiList(robot.name)
      )
    )
  }

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

  const handleOnValueChange = (ssidValue: string) => {
    const isJoinOrDisconnect =
      ssidValue === JOIN_OTHER_VALUE || ssidValue === DISCONNECT_WIFI_VALUE

    const currentSsid = !isJoinOrDisconnect ? ssidValue : null
    const currentPreviousSsid = ssid
    const currentNetworkingType = networkingTypeTable[ssidValue] || CONNECT
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
        {connectingTo && (
          <SpinnerModal
            message={`Attempting to connect to network ${connectingTo}`}
            alertOverlay
          />
        )}
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
