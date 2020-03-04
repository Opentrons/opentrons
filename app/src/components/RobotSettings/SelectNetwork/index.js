// @flow
import * as React from 'react'
import { /* useDispatch, */ useSelector } from 'react-redux'
import last from 'lodash/last'

import {
  useDispatchApiRequest,
  getRequestById,
  // dismissRequest,
  PENDING,
  // SUCCESS,
  // FAILURE,
} from '../../../robot-api'
import * as Networking from '../../../networking'

import { SelectSsid } from './SelectSsid'
// import { SelectNetworkModal } from './SelectNetworkModal'
import { ConnectModal } from './ConnectModal'
import { DisconnectModal } from './DisconnectModal'
import { JoinOtherModal } from './JoinOtherModal'
import { InProgressModal } from './InProgressModal'

import {
  // LIST_REFRESH_MS,
  // DISCONNECT_WIFI_VALUE,
  // JOIN_OTHER_VALUE,
  CONNECT,
  // NETWORKING_TYPE,
  DISCONNECT,
  JOIN_OTHER,
} from './constants'

// import { useStateSelectNetwork, stateSelector } from './hooks'
// import { getActiveSsid, getSecurityType, hasSecurityType } from './utils'

import type { State } from '../../../types'
import type { NetworkingAction } from './types'

type SelectNetworkProps = {| robotName: string |}

export const SelectNetwork = ({ robotName }: SelectNetworkProps) => {
  const list = useSelector((state: State) =>
    Networking.getWifiList(state, robotName)
  )
  const canDisconnect = useSelector((state: State) =>
    Networking.getCanDisconnect(state, robotName)
  )

  const [currentAction, setCurrentAction] = React.useState<NetworkingAction>({
    type: null,
  })

  const [dispatchApi, requestIds] = useDispatchApiRequest()

  const requestState = useSelector((state: State) =>
    getRequestById(state, last(requestIds))
  )

  const activeNetwork = list.find(nw => nw.active)

  const handleDisconnect = () => {
    if (activeNetwork) {
      dispatchApi(Networking.postWifiDisconnect(robotName, activeNetwork.ssid))
    }
  }

  // const {
  //   eapOptions,
  //   keys,
  //   connectingTo,
  //   configRequest,
  //   configResponse,
  //   configError,
  // } = useSelector((state: State) => stateSelector(state, robot))

  // const showConfig = configRequest && !!(configError || configResponse)

  // const [
  //   ssid,
  //   setSsid,
  //   previousSsid,
  //   setPreviousSsid,
  //   networkingType,
  //   setNetworkingType,
  //   securityType,
  //   setSecurityType,
  //   modalOpen,
  //   setModalOpen,
  // ] = useStateSelectNetwork(list)

  // const handleDisconnectWifiSuccess = React.useCallback(() => {
  //   setSsid(null)
  //   setPreviousSsid(null)
  //   setNetworkingType(CONNECT)
  //   setSecurityType(null)
  // }, [setSsid, setPreviousSsid, setNetworkingType, setSecurityType])

  // const latestRequestId = last(requestIds)

  // const disconnectRequest: RequestState | null = useSelector<
  //   State,
  //   RequestState | null
  // >(state => getRequestById(state, latestRequestId))

  // const status = disconnectRequest && disconnectRequest.status
  // const error =
  //   disconnectRequest && disconnectRequest.error && disconnectRequest.error
  // const response =
  //   disconnectRequest &&
  //   disconnectRequest.response &&
  //   disconnectRequest.response

  // const pending = status === PENDING
  // const failure = status === FAILURE

  // React.useEffect(() => {
  //   if (status === SUCCESS) {
  //     handleDisconnectWifiSuccess()
  //   }
  // }, [status, handleDisconnectWifiSuccess])

  // const dispatch = useDispatch()
  // const dispatchRefresh = () => dispatch(Networking.fetchWifiList(robot.name))
  // const dispatchConfigure = params => {
  //   return dispatch(
  //     chainActions(
  //       configureWifi(robot, params),
  //       startDiscovery(),
  //       Networking.fetchWifiList(robot.name)
  //     )
  //   )
  // }

  // const handleValueChange = (ssidValue: string) => {
  //   const isJoinOrDisconnect =
  //     ssidValue === JOIN_OTHER_VALUE || ssidValue === DISCONNECT_WIFI_VALUE

  //   const currentSsid = isJoinOrDisconnect ? null : ssidValue
  //   const currentPreviousSsid = ssid
  //   const currentNetworkingType = NETWORKING_TYPE[ssidValue] || CONNECT
  //   const currentSecurityType = getSecurityType(list, ssidValue)
  //   const currentModalOpen = hasSecurityType(currentSecurityType, NO_SECURITY)

  //   const canFetchEapOptions =
  //     hasSecurityType(securityType, WPA_EAP_SECURITY) || !securityType
  //   if (currentModalOpen) {
  //     dispatchConfigure({ ssid: ssidValue })
  //   } else if (canFetchEapOptions) {
  //     dispatch(fetchWifiEapOptions(robot))
  //     dispatch(fetchWifiKeys(robot))
  //   }

  //   setSsid(currentSsid)
  //   setPreviousSsid(currentPreviousSsid)
  //   setNetworkingType(currentNetworkingType)
  //   setSecurityType(currentSecurityType)
  //   setModalOpen(!currentModalOpen)
  // }

  // const handleCancel = () => {
  //   const currentSecurityType = getSecurityType(list, previousSsid)
  //   setSsid(previousSsid)
  //   setPreviousSsid(null)
  //   setNetworkingType(CONNECT)
  //   setSecurityType(currentSecurityType)
  //   setModalOpen(false)
  // }

  // const handleDisconnectWifi = () => {
  //   if (previousSsid) {
  //     dispatchApi(Networking.postWifiDisconnect(robot.name, previousSsid))
  //     setModalOpen(false)
  //   }
  // }

  const handleSelectConnect = ssid => {
    const network = list.find(nw => nw.ssid === ssid)
    network != null && setCurrentAction({ type: CONNECT, network })
  }

  const handleSelectDisconnect = () => {
    const ssid = activeNetwork?.ssid
    ssid != null && setCurrentAction({ type: DISCONNECT, ssid })
  }

  const handleSelectJoinOther = () => setCurrentAction({ type: JOIN_OTHER })

  const handleCancel = () => setCurrentAction({ type: null })

  return (
    <>
      <SelectSsid
        list={list}
        value={activeNetwork?.ssid ?? null}
        showWifiDisconnect={canDisconnect}
        onConnect={handleSelectConnect}
        onJoinOther={handleSelectJoinOther}
        onDisconnect={handleSelectDisconnect}
      />
      {requestState?.status === PENDING && currentAction.type ? (
        <InProgressModal {...currentAction} />
      ) : (
        <>
          {currentAction.type === CONNECT && (
            <ConnectModal
              network={currentAction.network}
              onCancel={handleCancel}
            />
          )}
          {currentAction.type === DISCONNECT && (
            <DisconnectModal
              ssid={currentAction.ssid}
              onDisconnect={handleDisconnect}
              onCancel={handleCancel}
            />
          )}
          {currentAction.type === JOIN_OTHER && (
            <JoinOtherModal onCancel={handleCancel} />
          )}
        </>
      )}
    </>
  )

  // TODO: (isk: 2/27/20): Refactor this SelectNetworkModal and handlers
  // return (
  //   <IntervalWrapper refresh={dispatchRefresh} interval={LIST_REFRESH_MS}>
  //     <SelectSsid
  //       list={list || []}
  //       value={getActiveSsid(list)}
  //       disabled={connectingTo != null}
  //       onValueChange={handleValueChange}
  //       showWifiDisconnect={showWifiDisconnect}
  //     />
  //     <SelectNetworkModal
  //       addKey={(file: File) => dispatch(addWifiKey(robot, file))}
  //       close={
  //         showConfig
  //           ? dispatch(clearConfigureWifiResponse(robot))
  //           : () => dispatch(dismissRequest(latestRequestId))
  //       }
  //       onDisconnectWifi={handleDisconnectWifi}
  //       onCancel={handleCancel}
  //       {...{
  //         connectingTo,
  //         pending,
  //         failure,
  //         modalOpen,
  //         ssid,
  //         previousSsid,
  //         networkingType,
  //         securityType,
  //         eapOptions,
  //         keys,
  //         dispatchConfigure,
  //         configRequest,
  //         configError,
  //         configResponse,
  //         response,
  //         error,
  //       }}
  //     />
  //   </IntervalWrapper>
  // )
}
