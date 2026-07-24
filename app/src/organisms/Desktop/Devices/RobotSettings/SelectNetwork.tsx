import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import last from 'lodash/last'

import {
  useEapOptionsQuery,
  useWifiKeysQuery,
} from '@opentrons/react-api-client'

import { getModalPortalEl } from '/app/App/portal'
import { useRobot } from '/app/redux-resources/robots'
import * as Networking from '/app/redux/networking'
import * as RobotApi from '/app/redux/robot-api'
import { useWifiList } from '/app/resources/networking/hooks'

import { ConnectModal } from './ConnectNetwork/ConnectModal'
import { CONNECT, JOIN_OTHER } from './ConnectNetwork/constants'
import { ResultModal } from './ConnectNetwork/ResultModal'
import { SelectSsid } from './ConnectNetwork/SelectSsid'

import type { WifiNetwork } from '@opentrons/api-client'
import type { Dispatch, State } from '/app/redux/types'
import type {
  NetworkChangeState,
  WifiConfigureRequest,
} from './ConnectNetwork/types'

interface SelectNetworkProps {
  robotName: string
  isRobotBusy: boolean
}

export const SelectNetwork = ({
  robotName,
  isRobotBusy,
}: SelectNetworkProps): JSX.Element => {
  const list = useWifiList(robotName)
  const robot = useRobot(robotName)
  const hostConfig =
    robot?.ip != null
      ? {
          hostname: robot.ip,
          port: robot.port,
          robotName,
        }
      : null
  const wifiKeysQuery = useWifiKeysQuery()
  const keys = wifiKeysQuery.data?.keys ?? []
  const [changeState, setChangeState] = useState<NetworkChangeState>({
    type: null,
  })
  const isConnecting =
    changeState.type === CONNECT || changeState.type === JOIN_OTHER
  const eapOptionsQuery = useEapOptionsQuery(
    { enabled: isConnecting },
    hostConfig
  )
  const eapOptions = eapOptionsQuery.data?.options ?? []
  const dispatch = useDispatch<Dispatch>()
  const [dispatchApi, requestIds] = RobotApi.useDispatchApiRequest()
  const requestState = useSelector((state: State) => {
    const lastId = last(requestIds)
    return lastId != null ? RobotApi.getRequestById(state, lastId) : null
  })
  const activeNetwork = list?.find(nw => nw.active)

  const handleConnect = (options: WifiConfigureRequest): void => {
    dispatchApi(Networking.postWifiConfigure(robotName, options))
    if (changeState.type === JOIN_OTHER) {
      setChangeState({ ...changeState, ssid: options.ssid })
    }
  }

  const handleSelectConnect = (ssid: string): void => {
    if (!isRobotBusy) {
      const network = list.find((nw: WifiNetwork) => nw.ssid === ssid)
      if (network != null) {
        const { ssid, securityType } = network

        if (securityType === Networking.SECURITY_NONE) {
          handleConnect({ ssid, securityType, hidden: false })
        }
        setChangeState({ type: CONNECT, ssid, network })
      }
    }
  }

  const handleSelectJoinOther = (): void => {
    if (!isRobotBusy) {
      setChangeState({ type: JOIN_OTHER, ssid: null })
    }
  }

  const handleDone = (): void => {
    const lastId = last(requestIds)
    if (lastId != null) {
      dispatch(RobotApi.dismissRequest(lastId))
    }
    setChangeState({ type: null })
  }

  return (
    <>
      <SelectSsid
        list={list}
        value={activeNetwork?.ssid ?? null}
        onConnect={handleSelectConnect}
        onJoinOther={handleSelectJoinOther}
        isRobotBusy={isRobotBusy}
      />
      {changeState.type != null &&
        createPortal(
          requestState != null ? (
            <ResultModal
              type={changeState.type}
              ssid={changeState.ssid}
              requestStatus={requestState.status}
              error={
                'error' in requestState &&
                requestState.error != null &&
                'message' in requestState.error &&
                requestState.error.message != null
                  ? requestState.error
                  : null
              }
              onClose={handleDone}
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
          ),
          getModalPortalEl()
        )}
    </>
  )
}
