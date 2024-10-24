import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import last from 'lodash/last'

import { EthernetConnectionDetails } from '/app/organisms/ODD/RobotSettingsDashboard/NetworkSettings/EthernetConnectionDetails'
import {
  DeviceReset,
  TouchscreenBrightness,
  TouchScreenSleep,
  LanguageSetting,
  NetworkSettings,
  Privacy,
  RobotName,
  RobotSettingsJoinOtherNetwork,
  RobotSettingsSelectAuthenticationType,
  RobotSettingsSetWifiCred,
  RobotSettingsWifi,
  RobotSettingsWifiConnect,
  RobotSystemVersion,
  UpdateChannel,
} from '/app/organisms/ODD/RobotSettingsDashboard'
import {
  getRobotUpdateAvailable,
  getRobotUpdateInfoForRobot,
} from '/app/redux/robot-update'
import {
  getLocalRobot,
  getRobotApiVersion,
  UNREACHABLE,
} from '/app/redux/discovery'
import { fetchStatus, postWifiConfigure } from '/app/redux/networking'
import { getRequestById, useDispatchApiRequest } from '/app/redux/robot-api'
import { useWifiList, useNetworkConnection } from '/app/resources/networking'
import { RobotSettingsList } from './RobotSettingsList'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { Dispatch, State } from '/app/redux/types'
import type { SettingOption } from '/app/organisms/ODD/RobotSettingsDashboard'

export function RobotSettingsDashboard(): JSX.Element {
  const { i18n, t } = useTranslation('shared')

  // GENERAL ROBOT INFORMATION
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const robotServerVersion =
    localRobot?.status != null ? getRobotApiVersion(localRobot) : null

  const robotUpdateType = useSelector((state: State) => {
    return localRobot != null && localRobot.status !== UNREACHABLE
      ? getRobotUpdateAvailable(state, localRobot)
      : null
  })
  const isUpdateAvailable = robotUpdateType === 'upgrade'
  const robotUpdateInfo = useSelector((state: State) =>
    localRobot != null && localRobot.status !== UNREACHABLE
      ? getRobotUpdateInfoForRobot(state, localRobot)
      : null
  )

  // ACTIVE CONNECTION INFORMATION
  const networkConnection = useNetworkConnection(robotName)
  const { activeSsid } = networkConnection
  const list = useWifiList(robotName)
  const connectedWifiAuthType = list.find(wifi => wifi.ssid === activeSsid)
    ?.securityType

  // LOCAL STATE MANAGEMENT for wi-fi user input
  const [selectedSsid, setSelectedSsid] = useState<string>('')
  const [selectedAuthType, setSelectedAuthType] = useState<WifiSecurityType>(
    'wpa-psk'
  )
  const [password, setPassword] = useState<string>('')

  // REQUESTS
  const dispatch = useDispatch<Dispatch>()
  const [dispatchApiRequest, requestIds] = useDispatchApiRequest()
  const requestState = useSelector((state: State) => {
    const lastId = last(requestIds)
    return lastId != null ? getRequestById(state, lastId) : null
  })

  const handleWifiConnect = (): void => {
    const options = {
      ssid: selectedSsid,
      securityType: selectedAuthType,
      hidden: selectedAuthType === 'none',
      psk: password,
    }
    dispatchApiRequest(postWifiConfigure(robotName, options))
    setCurrentOption('RobotSettingsWifiConnect')
    setPassword('')
  }

  useEffect(() => {
    dispatch(fetchStatus(robotName))
  }, [robotName, dispatch])

  // PAGE-LEVEL SWITCH MANAGEMENT
  const [currentOption, setCurrentOption] = useState<SettingOption | null>(null)

  switch (currentOption) {
    case 'RobotName':
      return <RobotName setCurrentOption={setCurrentOption} />
    case 'RobotSystemVersion':
      return (
        <RobotSystemVersion
          currentVersion={
            robotServerVersion ?? i18n.format(t('shared:unknown'), 'capitalize')
          }
          isUpdateAvailable={isUpdateAvailable}
          setCurrentOption={setCurrentOption}
          robotUpdateInfo={robotUpdateInfo}
        />
      )
    case 'NetworkSettings':
      return (
        <NetworkSettings
          networkConnection={networkConnection}
          setCurrentOption={setCurrentOption}
        />
      )
    case 'TouchscreenSleep':
      return <TouchScreenSleep setCurrentOption={setCurrentOption} />
    case 'TouchscreenBrightness':
      return <TouchscreenBrightness setCurrentOption={setCurrentOption} />
    case 'Privacy':
      return (
        <Privacy robotName={robotName} setCurrentOption={setCurrentOption} />
      )
    // TODO(bh, 2023-6-9): TextSize does not appear to be active in the app yet
    // case 'TextSize':
    //   return <TextSize setCurrentOption={setCurrentOption} />
    case 'DeviceReset':
      return (
        <DeviceReset
          robotName={robotName}
          setCurrentOption={setCurrentOption}
        />
      )
    case 'UpdateChannel':
      return (
        <UpdateChannel
          handleBackPress={() => {
            setCurrentOption(null)
          }}
        />
      )

    case 'RobotSettingsWifi':
      return (
        <RobotSettingsWifi
          activeSsid={activeSsid}
          connectedWifiAuthType={connectedWifiAuthType}
          setSelectedSsid={setSelectedSsid}
          setCurrentOption={setCurrentOption}
        />
      )
    case 'RobotSettingsJoinOtherNetwork':
      return (
        <RobotSettingsJoinOtherNetwork
          setCurrentOption={setCurrentOption}
          setSelectedSsid={setSelectedSsid}
        />
      )
    case 'RobotSettingsSelectAuthenticationType':
      return (
        <RobotSettingsSelectAuthenticationType
          handleWifiConnect={handleWifiConnect}
          selectedAuthType={selectedAuthType}
          setCurrentOption={setCurrentOption}
          setSelectedAuthType={setSelectedAuthType}
        />
      )
    case 'RobotSettingsSetWifiCred':
      return (
        <RobotSettingsSetWifiCred
          handleConnect={handleWifiConnect}
          password={password}
          setCurrentOption={setCurrentOption}
          setPassword={setPassword}
        />
      )
    case 'RobotSettingsWifiConnect':
      return (
        <RobotSettingsWifiConnect
          handleConnect={handleWifiConnect}
          requestState={requestState}
          selectedSsid={selectedSsid}
          setCurrentOption={setCurrentOption}
        />
      )

    case 'EthernetConnectionDetails':
      return (
        <EthernetConnectionDetails
          handleGoBack={() => {
            setCurrentOption('NetworkSettings')
          }}
        />
      )

    case 'LanguageSetting':
      return <LanguageSetting setCurrentOption={setCurrentOption} />

    // fallthrough option: render the robot settings list of buttons
    default:
      return <RobotSettingsList setCurrentOption={setCurrentOption} />
  }
}
