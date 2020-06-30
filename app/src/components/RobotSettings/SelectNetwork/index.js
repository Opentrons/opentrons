// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import last from 'lodash/last'

import { useInterval } from '@opentrons/components'
import * as RobotApi from '../../../robot-api'
import * as Networking from '../../../networking'

import { Portal } from '../../portal'
import type { State, Dispatch } from '../../../types'
import { SelectSsid } from './SelectSsid'
import { ConnectModal } from './ConnectModal'
import { DisconnectModal } from './DisconnectModal'
import { ResultModal } from './ResultModal'

import { CONNECT, DISCONNECT, JOIN_OTHER } from './constants'

import type { WifiConfigureRequest, NetworkChangeState } from './types'

type SelectNetworkProps = {| robotName: string |}

const LIST_REFRESH_MS = 10000

export const SelectNetwork = ({
  robotName,
}: SelectNetworkProps): React.Node => {
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
    // if we're connecting to a network, ensure we get the info needed to
    // populate the configuration forms
    if (changeState.type === CONNECT || changeState.type === JOIN_OTHER) {
      dispatch(Networking.fetchEapOptions(robotName))
      dispatch(Networking.fetchWifiKeys(robotName))
    }
  }, [robotName, dispatch, changeState.type])

  const handleSelectConnect = ssid => {
    const network = list.find(nw => nw.ssid === ssid)

    if (network) {
      const { ssid, securityType } = network

      if (securityType === Networking.SECURITY_NONE) {
        handleConnect({ ssid, securityType, hidden: false })
      }

      setChangeState({ type: CONNECT, ssid, network })
    }
  }

  const handleSelectDisconnect = () => {
    const ssid = activeNetwork?.ssid
    ssid != null && setChangeState({ type: DISCONNECT, ssid })
  }

  const handleSelectJoinOther = () => {
    setChangeState({ type: JOIN_OTHER, ssid: null })
  }

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
        <Portal>
          {requestState ? (
            <ResultModal
              type={changeState.type}
              ssid={changeState.ssid}
              isPending={requestState.status === RobotApi.PENDING}
              error={
                requestState.error && requestState.error.message
                  ? requestState.error
                  : null
              }
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
              robotName={robotName}
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
        </Portal>
      )}
    </>
  )
}
