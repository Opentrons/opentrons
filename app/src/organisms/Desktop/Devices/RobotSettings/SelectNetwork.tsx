import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch } from 'react-redux'

import { SECURITY_NONE } from '@opentrons/api-client'
import {
  isDocumentedMutationError,
  useEapOptionsQuery,
  usePostWifiConfigureMutation,
  useWifiKeysQuery,
} from '@opentrons/react-api-client'

import { getModalPortalEl } from '/app/App/portal'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useRobot } from '/app/redux-resources/robots'
import { startDiscovery } from '/app/redux/discovery'
import { useWifiList } from '/app/resources/networking/hooks'

import { ConnectModal } from './ConnectNetwork/ConnectModal'
import { CONNECT, JOIN_OTHER } from './ConnectNetwork/constants'
import { ResultModal } from './ConnectNetwork/ResultModal'
import { SelectSsid } from './ConnectNetwork/SelectSsid'

import type { WifiNetwork } from '@opentrons/api-client'
import type { Dispatch } from '/app/redux/types'
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
  const documentationState = useDocumentationState(undefined, robotName)
  const {
    postWifiConfigure,
    isLoading,
    isError,
    error,
    reset: resetWifiConfigure,
    status: configureStatus,
  } = usePostWifiConfigureMutation(
    documentationState,
    {
      onSuccess: () => {
        dispatch(startDiscovery())
      },
    },
    hostConfig
  )
  const activeNetwork = list?.find(nw => nw.active)

  const isDocumentedCancel =
    isError && error != null && isDocumentedMutationError(error)

  const showResultModal =
    changeState.type != null &&
    configureStatus !== 'idle' &&
    !isDocumentedCancel

  const handleConnect = (options: WifiConfigureRequest): void => {
    postWifiConfigure(options, {
      onError: configureError => {
        if (isDocumentedMutationError(configureError)) {
          resetWifiConfigure()
        }
      },
    })
    if (changeState.type === JOIN_OTHER) {
      setChangeState({ ...changeState, ssid: options.ssid })
    }
  }

  const handleSelectConnect = (ssid: string): void => {
    if (!isRobotBusy) {
      const network = list.find((nw: WifiNetwork) => nw.ssid === ssid)
      if (network != null) {
        const { ssid, securityType } = network

        if (securityType === SECURITY_NONE) {
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
    resetWifiConfigure()
    setChangeState({ type: null })
  }

  const configureErrorMessage =
    error != null && 'message' in error && error.message != null
      ? { message: error.message }
      : null

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
          showResultModal ? (
            <ResultModal
              type={changeState.type}
              ssid={changeState.ssid}
              isPending={isLoading}
              isError={isError && !isDocumentedCancel}
              error={
                isError && !isDocumentedCancel ? configureErrorMessage : null
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
