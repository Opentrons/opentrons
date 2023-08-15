import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  Btn,
  COLORS,
  BORDERS,
  DISPLAY_FLEX,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  TYPOGRAPHY,
  Icon,
  ALIGN_FLEX_START,
  JUSTIFY_CENTER,
} from '@opentrons/components'

import { getLocalRobot, getRobotApiVersion } from '../../../redux/discovery'
import { getRobotUpdateAvailable } from '../../../redux/robot-update'
import {
  DEV_INTERNAL_FLAGS,
  getApplyHistoricOffsets,
  getDevtoolsEnabled,
  getFeatureFlags,
  toggleDevInternalFlag,
} from '../../../redux/config'
import { UNREACHABLE } from '../../../redux/discovery/constants'
import { Navigation } from '../../../organisms/Navigation'
import { useLEDLights } from '../../../organisms/Devices/hooks'
import { onDeviceDisplayRoutes } from '../../../App/OnDeviceDisplayApp'
import { useNetworkConnection } from '../hooks'
import { RobotSettingButton } from './RobotSettingButton'

import type { Dispatch, State } from '../../../redux/types'
import type { SetSettingOption } from './'
import { StyledText } from '../../../atoms/text'

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
      ? getRobotUpdateAvailable(state, localRobot)
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
        {devToolsOn ? <FeatureFlags /> : null}
      </Flex>
    </Flex>
  )
}

function FeatureFlags(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const devInternalFlags = useSelector(getFeatureFlags)
  const dispatch = useDispatch<Dispatch>()
  return (
    <>
      {DEV_INTERNAL_FLAGS.map(flag => (
        <Btn
          key={flag}
          width="100%"
          marginBottom={SPACING.spacing8}
          backgroundColor={COLORS.light1}
          padding={`${SPACING.spacing20} ${SPACING.spacing24}`}
          borderRadius={BORDERS.borderRadiusSize4}
          display={DISPLAY_FLEX}
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing24}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
          onClick={() => {
            console.log('CLICKED TOGGLE flag', flag)
            dispatch(toggleDevInternalFlag(flag))
          }}
        >
          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing24}
            alignItems={ALIGN_CENTER}
          >
            <Icon name="alert-circle" size="3rem" color={COLORS.darkBlack100} />
            <Flex
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing2}
              alignItems={ALIGN_FLEX_START}
              justifyContent={JUSTIFY_CENTER}
              width="46.25rem"
            >
              <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                {t(`__dev_internal__${flag}`)}
              </StyledText>
            </Flex>
          </Flex>
          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing12}
            alignItems={ALIGN_CENTER}
            backgroundColor={COLORS.transparent}
            padding={`${SPACING.spacing12} ${SPACING.spacing4}`}
            borderRadius={BORDERS.borderRadiusSize4}
          >
            <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightRegular}>
              {Boolean(devInternalFlags?.[flag])
                ? t('shared:on')
                : t('shared:off')}
            </StyledText>
          </Flex>
        </Btn>
      ))}
    </>
  )
}
