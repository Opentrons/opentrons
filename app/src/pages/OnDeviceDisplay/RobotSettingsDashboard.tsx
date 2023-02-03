import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

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
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { getLocalRobot, getRobotApiVersion } from '../../redux/discovery'
import { getBuildrootUpdateAvailable } from '../../redux/buildroot'
import { UNREACHABLE } from '../../redux/discovery/constants'
import { Navigation } from '../../organisms/OnDeviceDisplay/Navigation'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'
import {
  DeviceReset,
  DisplayBrightness,
  DisplaySleepSettings,
  DisplayTextSize,
  NetworkSettings,
  RobotName,
  RobotSystemVersion,
} from '../../organisms/OnDeviceDisplay/RobotSettingsDashboard'

import type { State } from '../../redux/types'

const SETTING_BUTTON_STYLE = css`
  width: 100%;
  height: 6.875rem;
  margin-bottom: ${SPACING.spacing3};
  background-color: ${COLORS.medGreyEnabled};
  padding: 1.5rem;
  border-radius: 16px;
`

const robotSettingOptions = [
  'RobotName',
  'RobotSystemVersion',
  'NetworkSettings',
  'DisplaySleepSettings',
  'DisplayBrightness',
  'DisplayTextSize',
  'DeviceReset',
] as const

export type SettingOption = typeof robotSettingOptions[number]

export function RobotSettingsDashboard(): JSX.Element {
  const { t } = useTranslation('device_settings')
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
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
          robotServerVersion={robotServerVersion ?? 'Unknown'}
          isUpdateAvailable={isUpdateAvailable}
        />
      ) : (
        <>
          <Navigation routes={onDeviceDisplayRoutes} />
          {/* Robot Name */}
          <RobotSettingButton
            settingName={t('robot_name')}
            settingInfo={robotName}
            currentOption="RobotName"
            setCurrentOption={setCurrentOption}
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
          />
          {/* Network Settings */}
          <RobotSettingButton
            settingName={t('network_settings')}
            settingInfo={'Not connected'}
            currentOption="NetworkSettings"
            setCurrentOption={setCurrentOption}
          />

          {/* Display Sleep Settings */}
          <RobotSettingButton
            settingName={t('display_sleep_settings')}
            currentOption="DisplaySleepSettings"
            setCurrentOption={setCurrentOption}
          />

          {/* Display Brightness */}
          <RobotSettingButton
            settingName={t('display_brightness')}
            currentOption="DisplayBrightness"
            setCurrentOption={setCurrentOption}
          />

          {/* Display Text Size */}
          <RobotSettingButton
            settingName={t('display_text_size')}
            currentOption="DisplayTextSize"
            setCurrentOption={setCurrentOption}
          />

          {/* Device Reset */}
          <RobotSettingButton
            settingName={t('device_reset')}
            currentOption="DeviceReset"
            setCurrentOption={setCurrentOption}
          />
        </>
      )}
    </Flex>
  )
}

interface RobotSettingButtonProps {
  settingName: string
  settingInfo?: string
  currentOption: SettingOption
  setCurrentOption: (currentOption: SettingOption) => void
  isUpdateAvailable?: boolean
}

const RobotSettingButton = ({
  settingName,
  settingInfo,
  currentOption,
  setCurrentOption,
  isUpdateAvailable,
}: RobotSettingButtonProps): JSX.Element => {
  const { t } = useTranslation('app_settings')
  return (
    <Btn
      css={SETTING_BUTTON_STYLE}
      onClick={() => setCurrentOption(currentOption)}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing5}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing5}>
          <Icon name="wifi" size="3rem" />
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
            borderRadius="16px"
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
        <Icon name="chevron-right" size="3rem" />
      </Flex>
    </Btn>
  )
}

interface SettingsContentProps {
  currentOption: SettingOption
  setCurrentOption: (currentOption: SettingOption | null) => void
  robotServerVersion: string
  isUpdateAvailable: boolean
}
const SettingsContent = ({
  currentOption,
  setCurrentOption,
  robotServerVersion,
  isUpdateAvailable,
}: SettingsContentProps): JSX.Element => {
  let settingOption
  switch (currentOption) {
    case 'RobotName':
      settingOption = <RobotName setCurrentOption={setCurrentOption} />
      break
    case 'RobotSystemVersion':
      settingOption = (
        <RobotSystemVersion
          currentVersion={robotServerVersion}
          isUpdateAvailable={isUpdateAvailable}
          setCurrentOption={setCurrentOption}
        />
      )
      break
    case 'NetworkSettings':
      settingOption = <NetworkSettings setCurrentOption={setCurrentOption} />
      break
    case 'DisplaySleepSettings':
      settingOption = (
        <DisplaySleepSettings setCurrentOption={setCurrentOption} />
      )
      break
    case 'DisplayBrightness':
      settingOption = <DisplayBrightness setCurrentOption={setCurrentOption} />
      break
    case 'DisplayTextSize':
      settingOption = <DisplayTextSize setCurrentOption={setCurrentOption} />
      break
    case 'DeviceReset':
      settingOption = <DeviceReset setCurrentOption={setCurrentOption} />
      break
  }
  return settingOption
}
