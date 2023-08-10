import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Flex, DIRECTION_COLUMN, SPACING } from '@opentrons/components'

import { getLocalRobot, getRobotApiVersion } from '../../../redux/discovery'
import { getBuildrootUpdateAvailable } from '../../../redux/buildroot'
import {
  getApplyHistoricOffsets,
  getDevtoolsEnabled,
} from '../../../redux/config'
import { UNREACHABLE } from '../../../redux/discovery/constants'
import { Navigation } from '../../../organisms/Navigation'
import { useLEDLights } from '../../../organisms/Devices/hooks'
import { onDeviceDisplayRoutes } from '../../../App/OnDeviceDisplayApp'
import { useNetworkConnection } from '../hooks'
import { RobotSettingButton } from './RobotSettingButton'

import type { State } from '../../../redux/types'
import type { SetSettingOption } from './'

interface RobotSettingsListProps {
  setCurrentOption: SetSettingOption
}

export function RobotSettingsList(props: RobotSettingsListProps): JSX.Element {
  const { setCurrentOption } = props
  const { t } = useTranslation(['device_settings', 'app_settings'])
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const networkConnection = useNetworkConnection(robotName)

  const robotServerVersion =
    localRobot?.status != null ? getRobotApiVersion(localRobot) : null

  const robotUpdateType = useSelector((state: State) => {
    return localRobot != null && localRobot.status !== UNREACHABLE
      ? getBuildrootUpdateAvailable(state, localRobot)
      : null
  })
  const isUpdateAvailable = robotUpdateType === 'upgrade'
  const devToolsOn = useSelector(getDevtoolsEnabled)
  const historicOffsetsOn = useSelector(getApplyHistoricOffsets)
  const { lightsEnabled, toggleLights } = useLEDLights(robotName)

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Navigation routes={onDeviceDisplayRoutes} />
      <Flex paddingX={SPACING.spacing40} flexDirection={DIRECTION_COLUMN}>
        <RobotSettingButton
          settingName={t('network_settings')}
          settingInfo={networkConnection?.connectionStatus}
          currentOption="NetworkSettings"
          setCurrentOption={setCurrentOption}
          iconName="wifi"
        />
        <Link to="/robot-settings/rename-robot">
          <RobotSettingButton
            settingName={t('robot_name')}
            settingInfo={robotName}
            currentOption="RobotName"
            setCurrentOption={setCurrentOption}
            iconName="flex-robot"
          />
        </Link>
        <RobotSettingButton
          settingName={t('robot_system_version')}
          settingInfo={
            robotServerVersion != null
              ? `v${robotServerVersion}`
              : t('robot_settings_advanced_unknown')
          }
          currentOption="RobotSystemVersion"
          setCurrentOption={setCurrentOption}
          isUpdateAvailable={isUpdateAvailable}
          iconName="update"
        />
        <RobotSettingButton
          settingName={t('display_led_lights')}
          settingInfo={t('display_led_lights_description')}
          setCurrentOption={setCurrentOption}
          iconName="light"
          ledLights
          lightsOn={lightsEnabled}
          toggleLights={toggleLights}
        />
        <RobotSettingButton
          settingName={t('touchscreen_sleep')}
          currentOption="TouchscreenSleep"
          setCurrentOption={setCurrentOption}
          iconName="sleep"
        />
        <RobotSettingButton
          settingName={t('touchscreen_brightness')}
          currentOption="TouchscreenBrightness"
          setCurrentOption={setCurrentOption}
          iconName="brightness"
        />
        <RobotSettingButton
          settingName={t('apply_historic_offsets')}
          settingInfo={t('historic_offsets_description')}
          iconName="reticle"
          enabledHistoricOffests
          historicOffsetsOn={historicOffsetsOn}
        />
        <RobotSettingButton
          settingName={t('device_reset')}
          currentOption="DeviceReset"
          setCurrentOption={setCurrentOption}
          iconName="reset"
        />
        <RobotSettingButton
          settingName={t('app_settings:update_channel')}
          currentOption="UpdateChannel"
          setCurrentOption={setCurrentOption}
          iconName="update-channel"
        />
        <RobotSettingButton
          settingName={t('app_settings:enable_dev_tools')}
          settingInfo={t('dev_tools_description')}
          iconName="build"
          enabledDevTools
          devToolsOn={devToolsOn}
        />
      </Flex>
    </Flex>
  )
}
