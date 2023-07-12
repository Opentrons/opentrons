import * as React from 'react'
import { useSelector } from 'react-redux'
import last from 'lodash/last'

import { Flex, DIRECTION_COLUMN, SPACING } from '@opentrons/components'

import { StepMeter } from '../../../atoms/StepMeter'
import { DisplayWifiList } from '../../../organisms/NetworkSettings'
import * as Networking from '../../../redux/networking'
import { getLocalRobot } from '../../../redux/discovery'
import * as RobotApi from '../../../redux/robot-api'
import { useWifiList } from '../../../resources/networking/hooks'
import { JoinOtherNetwork } from './JoinOtherNetwork'
import { SelectAuthenticationType } from './SelectAuthenticationType'
import { SetWifiCred } from './SetWifiCred'
import { WifiConnectStatus } from './WifiConnectStatus'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { State } from '../../../redux/types'

const WIFI_LIST_POLL_MS = 5000
export type WifiScreenOption =
  | 'WifiList'
  | 'JoinOtherNetwork'
  | 'SelectAuthType'
  | 'SetWifiCred'
  | 'WifiConnectStatus'

export function ConnectViaWifi(): JSX.Element {
  const [selectedSsid, setSelectedSsid] = React.useState<string>('')
  const [
    selectedAuthType,
    setSelectedAuthType,
  ] = React.useState<WifiSecurityType>('wpa-psk')

  const [currentOption, setCurrentOption] = React.useState<WifiScreenOption>(
    'WifiList'
  )
  const [password, setPassword] = React.useState<string>('')
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const list = useWifiList(robotName, WIFI_LIST_POLL_MS)
  const [dispatchApiRequest, requestIds] = RobotApi.useDispatchApiRequest()
  const requestState = useSelector((state: State) => {
    const lastId = last(requestIds)
    return lastId != null ? RobotApi.getRequestById(state, lastId) : null
  })

  const handleConnect = (): void => {
    const options = {
      ssid: selectedSsid,
      securityType: selectedAuthType,
      hidden: false,
      psk: password,
    }
    dispatchApiRequest(Networking.postWifiConfigure(robotName, options))
    setCurrentOption('WifiConnectStatus')
    setPassword('')
  }

  let currentScreen: JSX.Element | null = null
  if (currentOption === 'WifiConnectStatus') {
    currentScreen = (
      <WifiConnectStatus
        handleConnect={handleConnect}
        requestState={requestState}
        setCurrentOption={setCurrentOption}
        selectedSsid={selectedSsid}
        selectedAuthType={selectedAuthType}
      />
    )
  } else if (currentOption === 'WifiList') {
    currentScreen = (
      <DisplayWifiList
        list={list}
        handleJoinAnotherNetwork={() => setCurrentOption('JoinOtherNetwork')}
        handleNetworkPress={(ssid: string) => {
          setSelectedSsid(ssid)
          setCurrentOption('SelectAuthType')
        }}
        isHeader
      />
    )
  } else if (currentOption === 'JoinOtherNetwork') {
    currentScreen = (
      <JoinOtherNetwork
        setCurrentOption={setCurrentOption}
        setSelectedSsid={setSelectedSsid}
      />
    )
  } else if (currentOption === 'SelectAuthType') {
    currentScreen = (
      <SelectAuthenticationType
        selectedAuthType={selectedAuthType}
        setSelectedAuthType={setSelectedAuthType}
        handleWifiConnect={handleConnect}
        setCurrentOption={setCurrentOption}
      />
    )
  } else if (currentOption === 'SetWifiCred') {
    currentScreen = (
      <SetWifiCred
        password={password}
        setPassword={setPassword}
        setCurrentOption={setCurrentOption}
        handleConnect={handleConnect}
      />
    )
  }

  return (
    <>
      <StepMeter totalSteps={6} currentStep={2} />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        // subtract height of StepMeter
        height={`calc(100% - ${SPACING.spacing12})`}
      >
        {currentScreen}
      </Flex>
    </>
  )
}
