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
import { InlineNotification } from '../../../atoms/InlineNotification'
import { toggleDevtools, toggleHistoricOffsets } from '../../../redux/config'
import { updateSetting } from '../../../redux/robot-settings'

import type { IconName } from '@opentrons/components'
import type { Dispatch } from '../../../redux/types'
import type { RobotSettingsField } from '../../../redux/robot-settings/types'
import type { SettingOption, SetSettingOption } from '../RobotSettingsDashboard'

const SETTING_BUTTON_STYLE = css`
  width: 100%;
  margin-bottom: ${SPACING.spacing8};
  background-color: ${COLORS.light1};
  padding: ${SPACING.spacing20} ${SPACING.spacing24};
  border-radius: ${BORDERS.borderRadiusSize4};

  &:active {
    background-color: ${COLORS.darkBlack40};
  }
`

interface RobotSettingButtonProps {
  settingName: string
  iconName: IconName
  settingInfo?: string
  currentOption?: SettingOption
  setCurrentOption?: SetSettingOption
  robotName?: string
  isUpdateAvailable?: boolean
  enabledDevTools?: boolean
  enabledHistoricOffests?: boolean
  devToolsOn?: boolean
  historicOffsetsOn?: boolean
  ledLights?: boolean
  lightsOn?: boolean
  toggleLights?: () => void
  enabledHomeGantry?: boolean
  homeGantrySettings?: RobotSettingsField
}

export function RobotSettingButton({
  settingName,
  settingInfo,
  currentOption,
  setCurrentOption,
  robotName,
  isUpdateAvailable,
  iconName,
  enabledDevTools,
  enabledHistoricOffests,
  devToolsOn,
  historicOffsetsOn,
  ledLights,
  lightsOn,
  toggleLights,
  enabledHomeGantry,
  homeGantrySettings,
}: RobotSettingButtonProps): JSX.Element {
  const { t, i18n } = useTranslation(['app_settings', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const settingValue = homeGantrySettings?.value
    ? homeGantrySettings.value
    : false
  const settingId = homeGantrySettings?.id
    ? homeGantrySettings.id
    : 'disableHomeOnBoot'

  const handleClick = (): void => {
    if (currentOption != null && setCurrentOption != null) {
      setCurrentOption(currentOption)
    } else if (Boolean(enabledDevTools)) {
      dispatch(toggleDevtools())
    } else if (Boolean(enabledHistoricOffests)) {
      dispatch(toggleHistoricOffsets())
    } else if (Boolean(ledLights)) {
      if (toggleLights != null) toggleLights()
    } else if (Boolean(enabledHomeGantry) && robotName != null) {
      dispatch(updateSetting(robotName, settingId, !settingValue))
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
        <Icon name={iconName} size="3rem" color={COLORS.darkBlack100} />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing2}
          alignItems={ALIGN_FLEX_START}
          justifyContent={JUSTIFY_CENTER}
          width="46.25rem"
        >
          <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {settingName}
          </StyledText>
          {settingInfo != null ? (
            <StyledText
              color={COLORS.darkBlack70}
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              textAlign={TYPOGRAPHY.textAlignLeft}
            >
              {settingInfo}
            </StyledText>
          ) : null}
        </Flex>
      </Flex>
      {enabledDevTools != null ? (
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing12}
          alignItems={ALIGN_CENTER}
          backgroundColor={COLORS.transparent}
          padding={`${SPACING.spacing12} ${SPACING.spacing4}`}
          borderRadius={BORDERS.borderRadiusSize4}
        >
          <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {Boolean(devToolsOn) ? t('shared:on') : t('shared:off')}
          </StyledText>
        </Flex>
      ) : null}
      {enabledHistoricOffests != null ? (
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing12}
          alignItems={ALIGN_CENTER}
          backgroundColor={COLORS.transparent}
          padding={`${SPACING.spacing12} ${SPACING.spacing4}`}
          borderRadius={BORDERS.borderRadiusSize4}
        >
          <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {Boolean(historicOffsetsOn) ? t('shared:on') : t('shared:off')}
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
          borderRadius={BORDERS.borderRadiusSize4}
        >
          <StyledText
            data-testid="RobotSettingButton_LED_Lights"
            as="h4"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {Boolean(lightsOn) ? t('shared:on') : t('shared:off')}
          </StyledText>
        </Flex>
      ) : null}
      <Flex gridGap={SPACING.spacing40} alignItems={ALIGN_CENTER}>
        {isUpdateAvailable ?? false ? (
          <InlineNotification
            type="alert"
            heading={i18n.format(t('update_available'), 'capitalize')}
            hug={true}
          />
        ) : null}
        {enabledHomeGantry != null ? (
          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing12}
            alignItems={ALIGN_CENTER}
            backgroundColor={COLORS.transparent}
            padding={`${SPACING.spacing12} ${SPACING.spacing4}`}
            borderRadius={BORDERS.borderRadiusSize4}
          >
            <StyledText
              data-testid="RobotSettingButton_Home_Gantry"
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
            >
              {Boolean(settingValue) ? t('shared:on') : t('shared:off')}
            </StyledText>
          </Flex>
        ) : null}
        {enabledDevTools == null &&
        enabledHistoricOffests == null &&
        ledLights == null &&
        enabledHomeGantry == null ? (
          <Icon name="more" size="3rem" color={COLORS.darkBlack100} />
        ) : null}
      </Flex>
    </Btn>
  )
}
