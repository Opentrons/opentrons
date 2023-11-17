import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import last from 'lodash/last'

import { useWifiList } from '../../../resources/networking/hooks'
import * as RobotApi from '../../../redux/robot-api'
import * as Networking from '../../../redux/networking'
import { Portal } from '../../../App/portal'
import { SelectSsid } from './ConnectNetwork/SelectSsid'
import { ConnectModal } from './ConnectNetwork/ConnectModal'
import { ResultModal } from './ConnectNetwork/ResultModal'
import { CONNECT, JOIN_OTHER } from './ConnectNetwork/constants'

import type { State, Dispatch } from '../../../redux/types'
import type { WifiNetwork } from '../../../redux/networking/types'
import type {
  WifiConfigureRequest,
  NetworkChangeState,
} from './ConnectNetwork/types'

interface TempSelectNetworkProps {
  robotName: string
  isRobotBusy: boolean
}

export const SelectNetwork = ({
  robotName,
  isRobotBusy,
}: TempSelectNetworkProps): JSX.Element => {
  const list = useWifiList(robotName)
  const keys = useSelector((state: State) =>
    Networking.getWifiKeys(state, robotName)
  )
  const eapOptions = useSelector((state: State) =>
    Networking.getEapOptions(state, robotName)
  )
  const [changeState, setChangeState] = React.useState<NetworkChangeState>({
    type: null,
  })
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

  React.useEffect(() => {
    // if we're connecting to a network, ensure we get the info needed to
    // populate the configuration forms
    if (changeState.type === CONNECT || changeState.type === JOIN_OTHER) {
      dispatch(Networking.fetchEapOptions(robotName))
      dispatch(Networking.fetchWifiKeys(robotName))
    }
  }, [robotName, dispatch, changeState.type])

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
      {changeState.type != null && (
        <Portal>
          {requestState != null ? (
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
          )}
        </Portal>
      )}
    </>
  )
}
