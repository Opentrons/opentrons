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
  LEGACY_COLORS,
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

import { getLocalRobot, getRobotApiVersion } from '../../redux/discovery'
import { getRobotUpdateAvailable } from '../../redux/robot-update'
import {
  DEV_INTERNAL_FLAGS,
  getApplyHistoricOffsets,
  getDevtoolsEnabled,
  getFeatureFlags,
  toggleDevInternalFlag,
  toggleDevtools,
  toggleHistoricOffsets,
} from '../../redux/config'
import { StyledText } from '../../atoms/text'
import { InlineNotification } from '../../atoms/InlineNotification'
import { getRobotSettings, updateSetting } from '../../redux/robot-settings'
import { UNREACHABLE } from '../../redux/discovery/constants'
import { Navigation } from '../../organisms/Navigation'
import { useLEDLights } from '../../organisms/Devices/hooks'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'
import { useNetworkConnection } from '../../resources/networking/hooks/useNetworkConnection'
import { RobotSettingButton } from '../../pages/RobotSettingsDashboard/RobotSettingButton'

import type { Dispatch, State } from '../../redux/types'
import type { SetSettingOption } from '../../pages/RobotSettingsDashboard'

const HOME_GANTRY_SETTING_ID = 'disableHomeOnBoot'
interface RobotSettingsListProps {
  setCurrentOption: SetSettingOption
}

export function RobotSettingsList(props: RobotSettingsListProps): JSX.Element {
  const { setCurrentOption } = props
  const { t, i18n } = useTranslation(['device_settings', 'app_settings'])
  const dispatch = useDispatch<Dispatch>()
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const networkConnection = useNetworkConnection(robotName)

  const robotServerVersion =
    localRobot?.status != null ? getRobotApiVersion(localRobot) : null

  const allRobotSettings = useSelector((state: State) =>
    getRobotSettings(state, robotName)
  )

  const isHomeGantryOn =
    allRobotSettings.find(({ id }) => id === HOME_GANTRY_SETTING_ID)?.value ??
    false

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
          dataTestId="RobotSettingButton_network_settings"
          settingInfo={networkConnection?.connectionStatus}
          onClick={() => setCurrentOption('NetworkSettings')}
          iconName="wifi"
        />
        <Link to="/robot-settings/rename-robot">
          <RobotSettingButton
            settingName={t('robot_name')}
            settingInfo={robotName}
            onClick={() => setCurrentOption('RobotName')}
            iconName="flex-robot"
          />
        </Link>
        <RobotSettingButton
          settingName={t('robot_system_version')}
          dataTestId="RobotSettingButton_robot_system_version"
          settingInfo={
            robotServerVersion != null
              ? `v${robotServerVersion}`
              : t('robot_settings_advanced_unknown')
          }
          onClick={() => setCurrentOption('RobotSystemVersion')}
          iconName="update"
          rightElement={
            <Flex gridGap={SPACING.spacing40} alignItems={ALIGN_CENTER}>
              {isUpdateAvailable ? (
                <InlineNotification
                  type="alert"
                  heading={i18n.format(
                    t('app_settings:update_available'),
                    'capitalize'
                  )}
                  hug={true}
                />
              ) : null}
              <Icon name="more" size="3rem" color={LEGACY_COLORS.darkBlack100} />
            </Flex>
          }
        />
        <RobotSettingButton
          settingName={t('display_led_lights')}
          dataTestId="RobotSettingButton_display_led_lights"
          settingInfo={t('display_led_lights_description')}
          iconName="light"
          rightElement={<OnOffToggle isOn={lightsEnabled} />}
          onClick={toggleLights}
        />
        <RobotSettingButton
          settingName={t('touchscreen_sleep')}
          dataTestId="RobotSettingButton_touchscreen_sleep"
          onClick={() => setCurrentOption('TouchscreenSleep')}
          iconName="sleep"
        />
        <RobotSettingButton
          settingName={t('touchscreen_brightness')}
          dataTestId="RobotSettingButton_touchscreen_brightness"
          onClick={() => setCurrentOption('TouchscreenBrightness')}
          iconName="brightness"
        />
        <RobotSettingButton
          settingName={t('app_settings:privacy')}
          dataTestId="RobotSettingButton_privacy"
          settingInfo={t('app_settings:choose_what_data_to_share')}
          onClick={() => setCurrentOption('Privacy')}
          iconName="privacy"
        />
        <RobotSettingButton
          settingName={t('apply_historic_offsets')}
          dataTestId="RobotSettingButton_apply_historic_offsets"
          settingInfo={t('historic_offsets_description')}
          iconName="reticle"
          rightElement={<OnOffToggle isOn={historicOffsetsOn} />}
          onClick={() => dispatch(toggleHistoricOffsets())}
        />
        <RobotSettingButton
          settingName={t('device_reset')}
          dataTestId="RobotSettingButton_device_reset"
          onClick={() => setCurrentOption('DeviceReset')}
          iconName="reset"
        />
        <RobotSettingButton
          settingName={t('gantry_homing')}
          dataTestId="RobotSettingButton_home_gantry_on_restart"
          settingInfo={t('gantry_homing_description')}
          iconName="gantry-homing"
          rightElement={<OnOffToggle isOn={!isHomeGantryOn} />}
          onClick={() =>
            dispatch(
              updateSetting(robotName, HOME_GANTRY_SETTING_ID, !isHomeGantryOn)
            )
          }
        />
        <RobotSettingButton
          settingName={t('app_settings:update_channel')}
          dataTestId="RobotSettingButton_update_channel"
          onClick={() => setCurrentOption('UpdateChannel')}
          iconName="update-channel"
        />
        <RobotSettingButton
          settingName={t('app_settings:enable_dev_tools')}
          dataTestId="RobotSettingButton_enable_dev_tools"
          settingInfo={t('dev_tools_description')}
          iconName="build"
          rightElement={<OnOffToggle isOn={devToolsOn} />}
          onClick={() => dispatch(toggleDevtools())}
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
          backgroundColor={LEGACY_COLORS.light1}
          padding={`${SPACING.spacing20} ${SPACING.spacing24}`}
          borderRadius={BORDERS.borderRadiusSize4}
          display={DISPLAY_FLEX}
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing24}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
          onClick={() => {
            dispatch(toggleDevInternalFlag(flag))
          }}
        >
          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing24}
            alignItems={ALIGN_CENTER}
          >
            <Icon name="alert-circle" size="3rem" color={LEGACY_COLORS.darkBlack100} />
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
          <OnOffToggle isOn={Boolean(devInternalFlags?.[flag])} />
        </Btn>
      ))}
    </>
  )
}

export function OnOffToggle(props: { isOn: boolean }): JSX.Element {
  const { t } = useTranslation('shared')
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing12}
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.transparent}
      padding={`${SPACING.spacing12} ${SPACING.spacing4}`}
      borderRadius={BORDERS.borderRadiusSize4}
    >
      <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightRegular}>
        {props.isOn ? t('on') : t('off')}
      </StyledText>
    </Flex>
  )
}
