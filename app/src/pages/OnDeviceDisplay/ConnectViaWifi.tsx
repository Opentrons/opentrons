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
  CONNECT,
  JOIN_OTHER,
} from '../../organisms/Devices/RobotSettings/ConnectNetwork/constants'
import {
  ConnectingNetwork,
  DisplayWifiList,
  FailedToConnect,
  SetWifiSsid,
  SelectAuthenticationType as SelectAuthenticationTypeComponent,
  SetWifiCred,
  WifiConnectionDetails,
} from '../../organisms/NetworkSettings'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { State } from '../../redux/types'
import type { RequestState } from '../../redux/robot-api/types'
import type { WifiNetwork } from '../../redux/networking/types'
import type { NetworkChangeState } from '../../organisms/Devices/RobotSettings/ConnectNetwork/types'
import { useTranslation } from 'react-i18next'
import { ChildNavigation } from '../../organisms/ChildNavigation'

const WIFI_LIST_POLL_MS = 5000
type WifiScreenOption = 'WifiList' | 'JoinOtherNetwork' | 'SelectAuthType'

export function ConnectViaWifi(): JSX.Element {
  const [selectedSsid, setSelectedSsid] = React.useState<string>('')
  const [
    showSelectAuthenticationType,
    setShowSelectAuthenticationType,
  ] = React.useState<boolean>(false)
  const [
    selectedAuthType,
    setSelectedAuthType,
  ] = React.useState<WifiSecurityType>('wpa-psk')
  const [changeState, setChangeState] = React.useState<NetworkChangeState>({
    type: null,
  })

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
    if (changeState.type === JOIN_OTHER) {
      setChangeState({ type: changeState.type, ssid: options.ssid })
    }
    setPassword('')
  }

  const renderScreen = (): JSX.Element | null => {
    if (currentOption === 'WifiList') {
      return (
        <DisplayWifiList
          list={list}
          handleJoinAnotherNetwork={() => setCurrentOption('JoinOtherNetwork')}
          setSelectedSsid={setSelectedSsid}
          onClickSsid={() => setCurrentOption('JoinOtherNetwork')}
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
        />
      )
      // This condition might be changed for manual connect
    } else if (changeState.ssid != null && currentRequestState === null) {
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
    } else if (
      changeState.ssid != null &&
      currentRequestState !== null &&
      currentRequestState.status === RobotApi.PENDING
    ) {
      return <ConnectingNetwork ssid={changeState.ssid} />
    } else if (
      changeState.ssid != null &&
      currentRequestState !== null &&
      currentRequestState.status === RobotApi.SUCCESS
    ) {
      return (
        <WifiConnectionDetails
          ssid={changeState.ssid}
          authType={selectedAuthType}
        />
      )
    } else if (
      changeState.ssid != null &&
      currentRequestState !== null &&
      currentRequestState.status === RobotApi.FAILURE
    ) {
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
    } else {
      return null
    }
  }

  React.useEffect(() => {
    setCurrentRequestState(requestState)
  }, [requestState])

  React.useEffect(() => {
    // TODO kj 01/30/2023 This authType None will be fixed in a following PR
    // a user selects none as authType
    if (selectedSsid !== '' && selectedAuthType === 'none') {
      const network = list.find((nw: WifiNetwork) => nw.ssid === selectedSsid)
      if (network != null) {
        handleConnect()
      }
    }
  }, [selectedSsid, selectedAuthType, list])

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
      <ChildNavigation
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
  const { t } = useTranslation('device_settings')

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <ChildNavigation
        buttonText={t('connect')}
        header={t('select_a_security_type')}
        onClickBack={() => setCurrentOption('Wifi')}
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
