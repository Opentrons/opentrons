import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StepMeter,
} from '@opentrons/components'
import { usePostWifiConfigureMutation } from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { DisplayWifiList } from '/app/organisms/ODD/NetworkSettings'
import { getLocalRobot, startDiscovery } from '/app/redux/discovery'
import { useWifiList } from '/app/resources/networking/hooks'

import { JoinOtherNetwork } from './JoinOtherNetwork'
import { WifiAuthenticationSelector } from './WifiAuthenticationSelector'
import { WifiConnectStatus } from './WifiConnectStatus'
import { WifiCredentialForm } from './WifiCredentialForm'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { Dispatch } from '/app/redux/types'

const WIFI_LIST_POLL_MS = 5000
export type WifiScreenOption =
  | 'WifiList'
  | 'JoinOtherNetwork'
  | 'SelectAuthType'
  | 'SetWifiCred'
  | 'WifiConnectStatus'

export function ConnectViaWifi(): JSX.Element {
  const [selectedSsid, setSelectedSsid] = useState<string>('')
  const [selectedAuthType, setSelectedAuthType] =
    useState<WifiSecurityType>('wpa-psk')

  const [currentOption, setCurrentOption] =
    useState<WifiScreenOption>('WifiList')
  const [password, setPassword] = useState<string>('')
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const list = useWifiList(robotName, WIFI_LIST_POLL_MS)
  const dispatch = useDispatch<Dispatch>()
  const documentationState = useDocumentationState()
  const {
    postWifiConfigure,
    isLoading,
    isSuccess,
    isError,
    error,
    reset: resetWifiConfigure,
  } = usePostWifiConfigureMutation(documentationState, {
    onSuccess: () => {
      dispatch(startDiscovery())
    },
  })

  const handleConnect = (): void => {
    const options = {
      ssid: selectedSsid,
      securityType: selectedAuthType,
      hidden: false,
      psk: password,
    }
    postWifiConfigure(options)
    setCurrentOption('WifiConnectStatus')
    setPassword('')
  }

  let currentScreen: JSX.Element | null = null
  if (currentOption === 'WifiConnectStatus') {
    currentScreen = (
      <WifiConnectStatus
        handleConnect={handleConnect}
        isPending={isLoading}
        isSuccess={isSuccess}
        isError={isError}
        error={error}
        resetConfigure={resetWifiConfigure}
        setCurrentOption={setCurrentOption}
        selectedSsid={selectedSsid}
        selectedAuthType={selectedAuthType}
      />
    )
  } else if (currentOption === 'WifiList') {
    currentScreen = (
      <DisplayWifiList
        list={list}
        handleJoinAnotherNetwork={() => {
          setCurrentOption('JoinOtherNetwork')
        }}
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
      <WifiAuthenticationSelector
        selectedAuthType={selectedAuthType}
        setSelectedAuthType={setSelectedAuthType}
        handleWifiConnect={handleConnect}
        setCurrentOption={setCurrentOption}
      />
    )
  } else if (currentOption === 'SetWifiCred') {
    currentScreen = (
      <WifiCredentialForm
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
