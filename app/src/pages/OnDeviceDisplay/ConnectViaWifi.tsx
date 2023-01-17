import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import last from 'lodash/last'

import {
  Flex,
  DIRECTION_COLUMN,
  useInterval,
  SPACING,
} from '@opentrons/components'

import { StepMeter } from '../../atoms/StepMeter'
import * as Networking from '../../redux/networking'
import { getLocalRobot } from '../../redux/discovery'
import * as RobotApi from '../../redux/robot-api'
import {
  CONNECT,
  JOIN_OTHER,
} from '../../organisms/Devices/RobotSettings/ConnectNetwork/constants'
import { DisplayWifiList } from '../../organisms/SetupNetwork/DisplayWifiList'
import { SelectAuthenticationType } from '../../organisms/SetupNetwork/SelectAuthenticationType'
import { SetWifiCred } from '../../organisms/SetupNetwork/SetWifiCred'
import { ConnectingNetwork } from '../../organisms/SetupNetwork/ConnectingNetwork'
import { SucceededToConnect } from '../../organisms/SetupNetwork/SucceededToConnect'
import { FailedToConnect } from '../../organisms/SetupNetwork/FailedToConnect'

import type { State, Dispatch } from '../../redux/types'
import type { RequestState } from '../../redux/robot-api/types'
import type {
  WifiConfigureRequest,
  NetworkChangeState,
} from '../../organisms/Devices/RobotSettings/ConnectNetwork/types'

const LIST_REFRESH_MS = 10000

export function ConnectViaWifi(): JSX.Element {
  const [isSearching, setIsSearching] = React.useState<boolean>(true)
  const [
    isShowSelectAuthenticationType,
    setIsShowSelectAuthenticationType,
  ] = React.useState<boolean>(false)
  const [selectedAuthType, setSelectedAuthType] = React.useState<
    'wpa-psk' | 'none'
  >('wpa-psk')
  const [changeState, setChangeState] = React.useState<NetworkChangeState>({
    type: null,
  })

  const [password, setPassword] = React.useState<string>('')
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const dispatch = useDispatch<Dispatch>()
  const list = useSelector((state: State) =>
    Networking.getWifiList(state, robotName)
  )

  const [dispatchApiRequest, requestIds] = RobotApi.useDispatchApiRequest()
  const requestState = useSelector((state: State) => {
    const lastId = last(requestIds)
    return lastId != null ? RobotApi.getRequestById(state, lastId) : null
  })
  const [
    currentRequestState,
    setCurrentRequestState,
  ] = React.useState<RequestState | null>(requestState)

  React.useEffect(() => {
    dispatch(Networking.fetchWifiList(robotName))
  }, [dispatch, robotName])

  useInterval(
    () => dispatch(Networking.fetchWifiList(robotName)),
    LIST_REFRESH_MS,
    true
  )

  React.useEffect(() => {
    if (list.length >= 1) {
      setIsSearching(false)
    }
  }, [list])

  React.useEffect(() => {
    setCurrentRequestState(requestState)
  }, [requestState])

  const formatNetworkOptions = (): WifiConfigureRequest => {
    // const securityType = selectedNetwork?.securityType
    const ssid = changeState.ssid
    const securityType = selectedAuthType
    const hidden = false
    const psk = password

    return {
      ssid,
      securityType,
      hidden,
      psk,
    }
  }

  const handleConnect = (): void => {
    const options = formatNetworkOptions()
    dispatchApiRequest(Networking.postWifiConfigure(robotName, options))
    if (changeState.type === JOIN_OTHER) {
      setChangeState({ ...changeState, ssid: options.ssid })
    }
    setPassword('')
  }

  const renderScreen = (): JSX.Element | null => {
    if (changeState.type == null) {
      return (
        <DisplayWifiList
          list={list}
          isSearching={isSearching}
          setIsShowSelectAuthenticationType={setIsShowSelectAuthenticationType}
          setChangeState={setChangeState}
        />
      )
    } else if (changeState.type === CONNECT && isShowSelectAuthenticationType) {
      return (
        <SelectAuthenticationType
          ssid={changeState.ssid}
          fromWifiList={true}
          setIsShowSelectAuthenticationType={setIsShowSelectAuthenticationType}
          setSelectedAuthType={setSelectedAuthType}
          setChangeState={setChangeState}
        />
      )
      // This condition might be changed for manual connect
    } else if (changeState.ssid != null) {
      if (currentRequestState === null) {
        return (
          <SetWifiCred
            ssid={changeState.ssid}
            setIsShowSelectAuthenticationType={
              setIsShowSelectAuthenticationType
            }
            authType={selectedAuthType}
            password={password}
            setPassword={setPassword}
            handleConnect={handleConnect}
          />
        )
      } else if (currentRequestState.status === RobotApi.PENDING) {
        return <ConnectingNetwork />
      } else if (currentRequestState.status === RobotApi.SUCCESS) {
        return (
          <SucceededToConnect
            ssid={changeState.ssid}
            authType={selectedAuthType}
          />
        )
      } else {
        return (
          <FailedToConnect
            ssid={changeState.ssid}
            requestState={currentRequestState}
            type={changeState.type}
            onConnect={handleConnect}
            setChangeState={setChangeState}
            setCurrentRequestState={setCurrentRequestState}
          />
        )
      }
    } else {
      return null
    }
  }

  return (
    <>
      <StepMeter totalSteps={5} currentStep={2} OnDevice />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${String(SPACING.spacing6)} ${String(
          SPACING.spacingXXL
        )} ${String(SPACING.spacingXXL)}`}
      >
        {renderScreen()}
      </Flex>
    </>
  )
}
