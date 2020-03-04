// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import last from 'lodash/last'

import * as RobotApi from '../../../robot-api'
import * as Networking from '../../../networking'

import { useInterval } from '@opentrons/components'
import { SelectSsid } from './SelectSsid'
// import { SelectNetworkModal } from './SelectNetworkModal'
import { ConnectModal } from './ConnectModal'
import { DisconnectModal } from './DisconnectModal'
import { InProgressModal } from './InProgressModal'
import { SuccessModal } from './SuccessModal'
import { FailureModal } from './FailureModal'

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

import type { State, Dispatch } from '../../../types'
import type { WifiConfigureRequest, NetworkChangeState } from './types'

type SelectNetworkProps = {| robotName: string |}

const LIST_REFRESH_MS = 10000

export const SelectNetwork = ({ robotName }: SelectNetworkProps) => {
  const list = useSelector((state: State) =>
    Networking.getWifiList(state, robotName)
  )
  const keys = useSelector((state: State) =>
    Networking.getWifiKeys(state, robotName)
  )
  const eapOptions = useSelector((state: State) =>
    Networking.getEapOptions(state, robotName)
  )
  const canDisconnect = useSelector((state: State) =>
    Networking.getCanDisconnect(state, robotName)
  )

  const [changeState, setChangeState] = React.useState<NetworkChangeState>({
    type: null,
  })

  const dispatch = useDispatch<Dispatch>()

  const [dispatchApi, requestIds] = RobotApi.useDispatchApiRequest()

  const requestState = useSelector((state: State) =>
    RobotApi.getRequestById(state, last(requestIds))
  )

  const activeNetwork = list.find(nw => nw.active)

  const handleDisconnect = () => {
    if (activeNetwork) {
      dispatchApi(Networking.postWifiDisconnect(robotName, activeNetwork.ssid))
    }
  }

  const handleConnect = (options: WifiConfigureRequest) => {
    dispatchApi(Networking.postWifiConfigure(robotName, options))
    if (changeState.type === JOIN_OTHER) {
      setChangeState({ ...changeState, ssid: options.ssid })
    }
  }

  useInterval(
    () => dispatch(Networking.fetchWifiList(robotName)),
    LIST_REFRESH_MS,
    true
  )

  React.useEffect(() => {
    dispatch(Networking.fetchEapOptions(robotName))
    dispatch(Networking.fetchWifiKeys(robotName))
  }, [robotName, dispatch])

  const handleSelectConnect = ssid => {
    const network = list.find(nw => nw.ssid === ssid)
    network != null && setChangeState({ type: CONNECT, ssid, network })
  }

  const handleSelectDisconnect = () => {
    const ssid = activeNetwork?.ssid
    ssid != null && setChangeState({ type: DISCONNECT, ssid })
  }

  const handleSelectJoinOther = () =>
    setChangeState({ type: JOIN_OTHER, ssid: null })

  const handleDone = () => {
    if (last(requestIds)) dispatch(RobotApi.dismissRequest(last(requestIds)))
    setChangeState({ type: null })
  }

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
      {changeState.type && (
        <>
          {requestState?.status === RobotApi.PENDING ? (
            <InProgressModal type={changeState.type} ssid={changeState.ssid} />
          ) : requestState?.status === RobotApi.SUCCESS ? (
            <SuccessModal
              type={changeState.type}
              ssid={changeState.ssid}
              onClose={handleDone}
            />
          ) : requestState && requestState.status === RobotApi.FAILURE ? (
            <FailureModal
              type={changeState.type}
              ssid={changeState.ssid}
              error={requestState.error}
              onClose={handleDone}
            />
          ) : changeState.type === DISCONNECT ? (
            <DisconnectModal
              ssid={changeState.ssid}
              onDisconnect={handleDisconnect}
              onCancel={handleDone}
            />
          ) : (
            <ConnectModal
              network={
                // if we're connecting to a known network, pass it to the ConnectModal
                // otherwise we're joining a hidden network, so set network to null
                changeState.type === CONNECT ? changeState.network : null
              }
              wifiKeys={keys}
              eapOptions={eapOptions}
              onConnect={handleConnect}
              onCancel={handleDone}
            />
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
