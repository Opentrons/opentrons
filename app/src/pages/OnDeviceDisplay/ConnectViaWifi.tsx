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
import { SetWifiSsid } from '../../organisms/SetupNetwork/SetWifiSsid'
import { SelectAuthenticationType } from '../../organisms/SetupNetwork/SelectAuthenticationType'
import { SetWifiCred } from '../../organisms/SetupNetwork/SetWifiCred'
import { ConnectingNetwork } from '../../organisms/SetupNetwork/ConnectingNetwork'
import { SucceededToConnect } from '../../organisms/SetupNetwork/SucceededToConnect'
import { FailedToConnect } from '../../organisms/SetupNetwork/FailedToConnect'

import type { State, Dispatch } from '../../redux/types'
import type { RequestState } from '../../redux/robot-api/types'
import type { WifiNetwork } from '../../redux/networking/types'
import type { NetworkChangeState } from '../../organisms/Devices/RobotSettings/ConnectNetwork/types'

const LIST_REFRESH_MS = 10000

export function ConnectViaWifi(): JSX.Element {
  const [isSearching, setIsSearching] = React.useState<boolean>(true)
  const [selectedSsid, setSelectedSsid] = React.useState<string>('')
  const [
    showSelectAuthenticationType,
    setShowSelectAuthenticationType,
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

  const handleConnect = (): void => {
    const options = {
      ssid: selectedSsid,
      securityType: selectedAuthType,
      hidden:
        selectedAuthType === 'none' ||
        (changeState.type === JOIN_OTHER && false),
      psk: password,
    }
    dispatchApiRequest(Networking.postWifiConfigure(robotName, options))
    // Note: kj 1/18/2023 for join_other network , this will be required by a following PR
    if (changeState.type === JOIN_OTHER) {
      setChangeState({ type: changeState.type, ssid: options.ssid })
    }
    setPassword('')
  }

  const renderScreen = (): JSX.Element | null => {
    if (changeState.type == null) {
      return (
        <DisplayWifiList
          list={list}
          isSearching={isSearching}
          setShowSelectAuthenticationType={setShowSelectAuthenticationType}
          setChangeState={setChangeState}
          setSelectedSsid={setSelectedSsid}
        />
      )
    } else if (changeState.type === JOIN_OTHER && changeState.ssid === null) {
      return (
        <SetWifiSsid
          setSelectedSsid={setSelectedSsid}
          setShowSelectAuthenticationType={setShowSelectAuthenticationType}
          setChangeState={setChangeState}
        />
      )
    } else if (showSelectAuthenticationType) {
      return (
        <SelectAuthenticationType
          ssid={selectedSsid}
          fromWifiList={true}
          setShowSelectAuthenticationType={setShowSelectAuthenticationType}
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
            setShowSelectAuthenticationType={setShowSelectAuthenticationType}
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
      console.log('here')
      return null
    }
  }

  React.useEffect(() => {
    dispatch(Networking.fetchWifiList(robotName))
  }, [dispatch, robotName])

  useInterval(
    () => dispatch(Networking.fetchWifiList(robotName)),
    LIST_REFRESH_MS,
    true
  )

  React.useEffect(() => {
    if (list != null && list.length > 0) {
      setIsSearching(false)
    }
  }, [list])

  React.useEffect(() => {
    setCurrentRequestState(requestState)
  }, [requestState])

  React.useEffect(() => {
    // a user selects none as authType
    if (selectedSsid !== '' && selectedAuthType === 'none') {
      const network = list.find((nw: WifiNetwork) => nw.ssid === selectedSsid)
      if (network != null) {
        handleConnect()
        setChangeState({ type: CONNECT, ssid: selectedSsid, network })
      }
    }
  }, [selectedSsid, selectedAuthType])

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
