import * as React from 'react'
import { useSelector } from 'react-redux'
import last from 'lodash/last'

import { Flex, DIRECTION_COLUMN, SPACING } from '@opentrons/components'

import { StepMeter } from '../../atoms/StepMeter'
import * as Networking from '../../redux/networking'
import { getLocalRobot } from '../../redux/discovery'
import * as RobotApi from '../../redux/robot-api'
import { useWifiList } from '../../resources/networking/hooks'
import {
  ConnectingNetwork,
  DisplayWifiList,
  FailedToConnect,
  SetWifiSsid,
  SelectAuthenticationType as SelectAuthenticationTypeComponent,
  SetWifiCred as SetWifiCredComponent,
  WifiConnectionDetails,
} from '../../organisms/NetworkSettings'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { State } from '../../redux/types'
import type { RequestState } from '../../redux/robot-api/types'
import { useTranslation } from 'react-i18next'
import { RobotSetupHeader } from '../../organisms/RobotSetupHeader'

const WIFI_LIST_POLL_MS = 5000
type WifiScreenOption =
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

  const renderScreen = (): JSX.Element | null => {
    if (currentOption === 'WifiConnectStatus') {
      return (
        <WifiConnectStatus
          handleConnect={handleConnect}
          requestState={requestState}
          setCurrentOption={setCurrentOption}
          selectedSsid={selectedSsid}
          selectedAuthType={selectedAuthType}
        />
      )
    } else if (currentOption === 'WifiList') {
      return (
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
      return (
        <JoinOtherNetwork
          setCurrentOption={setCurrentOption}
          setSelectedSsid={setSelectedSsid}
        />
      )
    } else if (currentOption === 'SelectAuthType') {
      return (
        <SelectAuthenticationType
          selectedAuthType={selectedAuthType}
          setSelectedAuthType={setSelectedAuthType}
          handleWifiConnect={handleConnect}
          setCurrentOption={setCurrentOption}
        />
      )
    } else if (currentOption === 'SetWifiCred') {
      return (
        <SetWifiCred
          password={password}
          setPassword={setPassword}
          setCurrentOption={setCurrentOption}
          handleConnect={handleConnect}
        />
      )
    } else {
      return null
    }
  }

  return (
    <>
      <StepMeter totalSteps={5} currentStep={2} />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing32} ${SPACING.spacing40} ${SPACING.spacing40}`}
      >
        {renderScreen()}
      </Flex>
    </>
  )
}

interface JoinOtherNetworkProps {
  setCurrentOption: (option: WifiScreenOption) => void
  setSelectedSsid: React.Dispatch<React.SetStateAction<string>>
}

function JoinOtherNetwork({
  setCurrentOption,
  setSelectedSsid,
}: JoinOtherNetworkProps): JSX.Element {
  const { i18n, t } = useTranslation('device_settings')

  const [inputSsid, setInputSsid] = React.useState<string>('')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleContinue = (): void => {
    if (inputSsid.length >= 2 && inputSsid.length <= 32) {
      setSelectedSsid(inputSsid)
      setCurrentOption('SelectAuthType')
    } else {
      setErrorMessage(t('join_other_network_error_message'))
    }
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <RobotSetupHeader
        buttonText={i18n.format(t('continue'), 'capitalize')}
        header={t('join_other_network')}
        onClickBack={() => setCurrentOption('WifiList')}
        onClickButton={handleContinue}
      />
      <SetWifiSsid
        errorMessage={errorMessage}
        inputSsid={inputSsid}
        setInputSsid={setInputSsid}
      />
    </Flex>
  )
}

interface SelectAuthenticationTypeProps {
  handleWifiConnect: () => void
  selectedAuthType: WifiSecurityType
  setCurrentOption: (option: WifiScreenOption) => void
  setSelectedAuthType: (authType: WifiSecurityType) => void
}
function SelectAuthenticationType({
  handleWifiConnect,
  selectedAuthType,
  setCurrentOption,
  setSelectedAuthType,
}: SelectAuthenticationTypeProps): JSX.Element {
  const { i18n, t } = useTranslation('device_settings')

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <RobotSetupHeader
        buttonText={i18n.format(t('continue'), 'capitalize')}
        header={t('select_a_security_type')}
        onClickBack={() => setCurrentOption('WifiList')}
        onClickButton={() => {
          selectedAuthType !== 'none'
            ? setCurrentOption('SetWifiCred')
            : handleWifiConnect()
        }}
      />
      <SelectAuthenticationTypeComponent
        selectedAuthType={selectedAuthType}
        setSelectedAuthType={setSelectedAuthType}
      />
    </Flex>
  )
}

interface SetWifiCredProps {
  handleConnect: () => void
  password: string
  setCurrentOption: (option: WifiScreenOption) => void
  setPassword: React.Dispatch<React.SetStateAction<string>>
}

export function SetWifiCred({
  handleConnect,
  password,
  setCurrentOption,
  setPassword,
}: SetWifiCredProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <RobotSetupHeader
        buttonText={t('connect')}
        header={t('sign_into_wifi')}
        onClickBack={() => setCurrentOption('SelectAuthType')}
        onClickButton={handleConnect}
      />
      <SetWifiCredComponent password={password} setPassword={setPassword} />
    </Flex>
  )
}

interface WifiConnectStatusProps {
  handleConnect: () => void
  requestState: RequestState | null
  selectedSsid: string
  setCurrentOption: (option: WifiScreenOption) => void
  selectedAuthType: WifiSecurityType
}

export function WifiConnectStatus({
  handleConnect,
  requestState,
  setCurrentOption,
  selectedSsid,
  selectedAuthType,
}: WifiConnectStatusProps): JSX.Element | null {
  if (requestState == null) {
    return null
  } else if (requestState.status === RobotApi.PENDING) {
    return <ConnectingNetwork height={'33rem'} ssid={selectedSsid} />
  } else if (requestState.status === RobotApi.FAILURE) {
    const isInvalidPassword = requestState.response.status === 401
    return (
      <FailedToConnect
        requestState={requestState}
        selectedSsid={selectedSsid}
        handleTryAgain={() =>
          isInvalidPassword ? setCurrentOption('SetWifiCred') : handleConnect()
        }
        isInvalidPassword={isInvalidPassword}
        handleChangeNetwork={() => setCurrentOption('WifiList')}
      />
    )
  } else if (requestState.status === RobotApi.SUCCESS) {
    return (
      <WifiConnectionDetails ssid={selectedSsid} authType={selectedAuthType} />
    )
  } else {
    return null
  }
}
