import * as React from 'react'

import {
  DeviceReset,
  TouchscreenBrightness,
  TouchScreenSleep,
  TextSize,
  NetworkSettings,
  RobotName,
  RobotSystemVersion,
  UpdateChannel,
} from '../../../organisms/RobotSettingsDashboard'

import type { NetworkConnection } from '../hooks'
import type { SettingOption } from './RobotSettingButton'

interface RobotSettingsContentProps {
  currentOption: SettingOption
  setCurrentOption: (currentOption: SettingOption | null) => void
  networkConnection: NetworkConnection
  robotName: string
  robotServerVersion: string
  isUpdateAvailable: boolean
  devToolsOn: boolean
}
export function RobotSettingsContent({
  currentOption,
  setCurrentOption,
  networkConnection,
  robotName,
  robotServerVersion,
  isUpdateAvailable,
  devToolsOn,
}: RobotSettingsContentProps): JSX.Element {
  switch (currentOption) {
    case 'RobotName':
      return <RobotName setCurrentOption={setCurrentOption} />
    case 'RobotSystemVersion':
      return (
        <RobotSystemVersion
          currentVersion={robotServerVersion}
          isUpdateAvailable={isUpdateAvailable}
          setCurrentOption={setCurrentOption}
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
    case 'TextSize':
      return <TextSize setCurrentOption={setCurrentOption} />
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
          setCurrentOption={setCurrentOption}
          devToolsOn={devToolsOn}
        />
      )
  }
}
