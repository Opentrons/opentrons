import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { Link } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  COLORS,
  Btn,
  Icon,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  JUSTIFY_CENTER,
  TYPOGRAPHY,
  ALIGN_FLEX_END,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { TertiaryButton } from '../../atoms/buttons'
import { getLocalRobot, getRobotApiVersion } from '../../redux/discovery'
import { getBuildrootUpdateAvailable } from '../../redux/buildroot'
import { getDevtoolsEnabled, toggleDevtools } from '../../redux/config'
import { UNREACHABLE } from '../../redux/discovery/constants'
import { Navigation } from '../../organisms/OnDeviceDisplay/Navigation'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'
import { useNetworkConnection } from './hooks'
import {
  DeviceReset,
  DisplayLEDLights,
  TouchscreenBrightness,
  TouchScreenSleep,
  TextSize,
  NetworkSettings,
  RobotName,
  RobotSystemVersion,
  UpdateChannel,
} from '../../organisms/OnDeviceDisplay/RobotSettingsDashboard'

import type { IconName } from '@opentrons/components'
import type { NetworkConnection } from './hooks'
import type { Dispatch, State } from '../../redux/types'

const SETTING_BUTTON_STYLE = css`
  width: 100%;
  height: 6.875rem;
  margin-bottom: ${SPACING.spacing3};
  background-color: ${COLORS.medGreyEnabled};
  padding: 1.5rem;
  border-radius: ${BORDERS.size_four};
`
export type SettingOption =
  | 'NetworkSettings'
  | 'RobotName'
  | 'RobotSystemVersion'
  | 'DisplayLEDLights'
  | 'TouchscreenSleep'
  | 'TouchscreenBrightness'
  | 'TextSize'
  | 'DeviceReset'
  | 'UpdateChannel'

export function RobotSettingsDashboard(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'app_settings'])
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const networkConnection = useNetworkConnection(robotName)
  const [
    currentOption,
    setCurrentOption,
  ] = React.useState<SettingOption | null>(null)
  const robotServerVersion =
    localRobot?.status != null ? getRobotApiVersion(localRobot) : null

  const robotUpdateType = useSelector((state: State) => {
    return localRobot != null && localRobot.status !== UNREACHABLE
      ? getBuildrootUpdateAvailable(state, localRobot)
      : null
  })
  const isUpdateAvailable = robotUpdateType === 'upgrade'
  const devToolsOn = useSelector(getDevtoolsEnabled)

  return (
    <Flex
      padding={`${SPACING.spacing6} ${SPACING.spacingXXL} ${SPACING.spacingXXL}`}
      flexDirection={DIRECTION_COLUMN}
      columnGap={SPACING.spacing3}
    >
      {currentOption != null ? (
        <SettingsContent
          currentOption={currentOption}
          setCurrentOption={setCurrentOption}
          networkConnection={networkConnection}
          robotName={robotName}
          robotServerVersion={robotServerVersion ?? 'Unknown'}
          isUpdateAvailable={isUpdateAvailable}
          devToolsOn={devToolsOn}
        />
      ) : (
        <>
          <Navigation routes={onDeviceDisplayRoutes} />

          {/* Network Settings */}
          <RobotSettingButton
            settingName={t('network_settings')}
            settingInfo={networkConnection?.connectionStatus}
            currentOption="NetworkSettings"
            setCurrentOption={setCurrentOption}
            iconName="wifi"
          />

          {/* Robot Name */}
          <RobotSettingButton
            settingName={t('robot_name')}
            settingInfo={robotName}
            currentOption="RobotName"
            setCurrentOption={setCurrentOption}
            iconName="flex-robot"
          />

          {/* Robot System Version */}
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

          {/* Display LED Lights */}
          <RobotSettingButton
            settingName={t('display_led_lights')}
            currentOption="DisplayLEDLights"
            setCurrentOption={setCurrentOption}
            iconName="light"
          />

          {/* Touchscreen Sleep */}
          <RobotSettingButton
            settingName={t('touchscreen_sleep')}
            currentOption="TouchscreenSleep"
            setCurrentOption={setCurrentOption}
            iconName="sleep"
          />

          {/* Touchscreen Brightness */}
          <RobotSettingButton
            settingName={t('touchscreen_brightness')}
            currentOption="TouchscreenBrightness"
            setCurrentOption={setCurrentOption}
            iconName="brightness"
          />

          {/* Text Size */}
          <RobotSettingButton
            settingName={t('text_size')}
            currentOption="TextSize"
            setCurrentOption={setCurrentOption}
            iconName="text-size"
          />

          {/* Device Reset */}
          <RobotSettingButton
            settingName={t('device_reset')}
            currentOption="DeviceReset"
            setCurrentOption={setCurrentOption}
            iconName="reset"
          />
          {/* Update Channel */}
          <RobotSettingButton
            settingName={t('app_settings:update_channel')}
            currentOption="UpdateChannel"
            setCurrentOption={setCurrentOption}
            iconName="wifi"
          />
          {/* Enable Developer Tools */}
          <RobotSettingButton
            settingName={t('app_settings:enable_dev_tools')}
            settingInfo={t('dev_tools_description')}
            iconName="build"
            enabledDevTools
            devToolsOn={devToolsOn}
          />
        </>
      )}

      <Flex
        alignSelf={ALIGN_FLEX_END}
        marginTop={SPACING.spacing5}
        width="fit-content"
      >
        <Link to="menu">
          <TertiaryButton>To ODD Menu</TertiaryButton>
        </Link>
      </Flex>
    </Flex>
  )
}

interface RobotSettingButtonProps {
  settingName: string
  iconName: IconName
  settingInfo?: string
  currentOption?: SettingOption
  setCurrentOption?: (currentOption: SettingOption) => void
  robotName?: string
  isUpdateAvailable?: boolean
  enabledDevTools?: boolean
  devToolsOn?: boolean
}

const RobotSettingButton = ({
  settingName,
  settingInfo,
  currentOption,
  setCurrentOption,
  robotName,
  isUpdateAvailable,
  iconName,
  enabledDevTools,
  devToolsOn,
}: RobotSettingButtonProps): JSX.Element => {
  const { t } = useTranslation(['app_settings', 'shared'])
  const dispatch = useDispatch<Dispatch>()

  const handleClick = (): void => {
    if (currentOption != null && setCurrentOption != null) {
      setCurrentOption(currentOption)
    } else {
      dispatch(toggleDevtools())
    }
  }

  return (
    <Btn css={SETTING_BUTTON_STYLE} onClick={handleClick}>
      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing5}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing5}>
          <Icon name={iconName} size="3rem" />
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing1}
            alignItems={ALIGN_FLEX_START}
            justifyContent={JUSTIFY_CENTER}
          >
            <StyledText
              fontSize="1.5rem"
              lineHeight="1.875rem"
              fontWeight="700"
            >
              {settingName}
            </StyledText>
            {settingInfo != null ? (
              <StyledText
                color={COLORS.darkGreyEnabled}
                fontSize="1.375rem"
                lineHeight="1.875rem"
                fontWeight="400"
              >
                {settingInfo}
              </StyledText>
            ) : null}
          </Flex>
        </Flex>
        {isUpdateAvailable ?? false ? (
          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap="0.75rem"
            alignItems={ALIGN_CENTER}
            backgroundColor={COLORS.warningBackgroundMed}
            padding={`0.75rem ${SPACING.spacing4}`}
            borderRadius={BORDERS.size_four}
          >
            <Icon
              name="ot-alert"
              size="1.75rem"
              color={COLORS.warningEnabled}
            />
            <StyledText
              fontSize="1.375rem"
              lineHeight="1.625rem"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {t('update_available')}
            </StyledText>
          </Flex>
        ) : null}

        {enabledDevTools != null ? (
          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap="0.75rem"
            alignItems={ALIGN_CENTER}
            backgroundColor={COLORS.transparent}
            padding={`0.75rem ${SPACING.spacing4}`}
            borderRadius={BORDERS.size_four}
          >
            <StyledText
              fontSize="1.75rem"
              lineHeight="2.25rem"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
            >
              {Boolean(devToolsOn) ? t('shared:on') : t('shared:off')}
            </StyledText>
          </Flex>
        ) : null}
        {enabledDevTools == null ? (
          <Icon name="chevron-right" size="3rem" />
        ) : null}
      </Flex>
    </Btn>
  )
}

interface SettingsContentProps {
  currentOption: SettingOption
  setCurrentOption: (currentOption: SettingOption | null) => void
  networkConnection: NetworkConnection
  robotName: string
  robotServerVersion: string
  isUpdateAvailable: boolean
  devToolsOn: boolean
}
const SettingsContent = ({
  currentOption,
  setCurrentOption,
  networkConnection,
  robotName,
  robotServerVersion,
  isUpdateAvailable,
  devToolsOn,
}: SettingsContentProps): JSX.Element => {
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
    case 'DisplayLEDLights':
      return <DisplayLEDLights setCurrentOption={setCurrentOption} />
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
