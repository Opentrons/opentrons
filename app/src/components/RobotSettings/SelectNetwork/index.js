// @flow
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import find from 'lodash/find'
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
  DISCONNECT,
  JOIN,
} from './constants'

import { useStateRef, stateSelector } from './hooks'

// import type { State } from '../../../types'
// import type { RequestState } from '../../../robot-api/types'
import type { ViewableRobot } from '../../../discovery/types'
import type { PostDisconnectNetworkAction } from '../../../networking/types'

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
  ] = useStateRef(list)

  // This entire handler need to be refactored and tested
  // this isn't working properly ATM
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
    const robotName = robot && robot?.name

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
