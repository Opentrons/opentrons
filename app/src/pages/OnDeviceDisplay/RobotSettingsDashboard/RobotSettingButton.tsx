import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { toggleDevtools } from '../../../redux/config'

import type { IconName } from '@opentrons/components'
import type { Dispatch } from '../../../redux/types'

export type SettingOption =
  | 'NetworkSettings'
  | 'RobotName'
  | 'RobotSystemVersion'
  | 'TouchscreenSleep'
  | 'TouchscreenBrightness'
  | 'TextSize'
  | 'DeviceReset'
  | 'UpdateChannel'

const SETTING_BUTTON_STYLE = css`
  width: 100%;
  margin-bottom: ${SPACING.spacing8};
  background-color: ${COLORS.medGreyEnabled};
  padding: ${SPACING.spacing20} ${SPACING.spacing24};
  border-radius: ${BORDERS.size_four};
`

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
  ledLights?: boolean
  lightsOn?: boolean
  toggleLights?: () => void
}

export function RobotSettingButton({
  settingName,
  settingInfo,
  currentOption,
  setCurrentOption,
  isUpdateAvailable,
  iconName,
  enabledDevTools,
  devToolsOn,
  ledLights,
  lightsOn,
  toggleLights,
}: RobotSettingButtonProps): JSX.Element {
  const { t } = useTranslation(['app_settings', 'shared'])
  const dispatch = useDispatch<Dispatch>()

  const handleClick = (): void => {
    if (currentOption != null && setCurrentOption != null) {
      setCurrentOption(currentOption)
    } else if (Boolean(enabledDevTools)) {
      dispatch(toggleDevtools())
    } else if (Boolean(ledLights)) {
      if (toggleLights != null) toggleLights()
    }
  }

  return (
    <Btn
      css={SETTING_BUTTON_STYLE}
      onClick={handleClick}
      display={DISPLAY_FLEX}
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing24}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing24}
        alignItems={ALIGN_CENTER}
      >
        <Icon name={iconName} size="3rem" />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing2}
          alignItems={ALIGN_FLEX_START}
          justifyContent={JUSTIFY_CENTER}
        >
          <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {settingName}
          </StyledText>
          {settingInfo != null ? (
            <StyledText
              color={COLORS.darkGreyEnabled}
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              textAlign={TYPOGRAPHY.textAlignLeft}
            >
              {settingInfo}
            </StyledText>
          ) : null}
        </Flex>
      </Flex>
      {isUpdateAvailable ?? false ? (
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing12}
          alignItems={ALIGN_CENTER}
          backgroundColor={COLORS.warningBackgroundMed}
          padding={`${SPACING.spacing12} ${SPACING.spacing4}`}
          borderRadius={BORDERS.size_four}
        >
          <Icon name="ot-alert" size="1.75rem" color={COLORS.warningEnabled} />
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {t('update_available')}
          </StyledText>
        </Flex>
      ) : null}

      {enabledDevTools != null ? (
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing12}
          alignItems={ALIGN_CENTER}
          backgroundColor={COLORS.transparent}
          padding={`${SPACING.spacing12} ${SPACING.spacing4}`}
          borderRadius={BORDERS.size_four}
        >
          <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {Boolean(devToolsOn) ? t('shared:on') : t('shared:off')}
          </StyledText>
        </Flex>
      ) : null}

      {ledLights != null ? (
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing12}
          alignItems={ALIGN_CENTER}
          backgroundColor={COLORS.transparent}
          padding={`${SPACING.spacing12} ${SPACING.spacing4}`}
          borderRadius={BORDERS.size_four}
        >
          <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {Boolean(lightsOn) ? t('shared:on') : t('shared:off')}
          </StyledText>
        </Flex>
      ) : null}

      {enabledDevTools == null && ledLights == null ? (
        <Icon name="chevron-right" size="3rem" />
      ) : null}
    </Btn>
  )
}
