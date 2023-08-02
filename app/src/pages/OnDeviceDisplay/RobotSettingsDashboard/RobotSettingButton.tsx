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
import { toggleDevtools } from '../../../redux/config'

import type { IconName } from '@opentrons/components'
import type { Dispatch } from '../../../redux/types'
import type { SettingOption, SetSettingOption } from '../RobotSettingsDashboard'

const SETTING_BUTTON_STYLE = css`
  width: 100%;
  margin-bottom: ${SPACING.spacing8};
  background-color: ${COLORS.light1};
  padding: ${SPACING.spacing20} ${SPACING.spacing24};
  border-radius: ${BORDERS.borderRadiusSize4};
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
  const { t, i18n } = useTranslation(['app_settings', 'shared'])
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
        <Icon name={iconName} size="3rem" color={COLORS.darkBlack100} />
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

      {ledLights != null ? (
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing12}
          alignItems={ALIGN_CENTER}
          backgroundColor={COLORS.transparent}
          padding={`${SPACING.spacing12} ${SPACING.spacing4}`}
          borderRadius={BORDERS.borderRadiusSize4}
        >
          <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightRegular}>
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
        {enabledDevTools == null && ledLights == null ? (
          <Icon name="more" size="3rem" color={COLORS.darkBlack100} />
        ) : null}
      </Flex>
    </Btn>
  )
}
