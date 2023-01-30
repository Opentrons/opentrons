import * as React from 'react'
import { useSelector } from 'react-redux'
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
  ALIGN_FLEX_END,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { TertiaryButton } from '../../atoms/buttons'
import { getLocalRobot } from '../../redux/discovery'
import { Navigation } from '../../organisms/OnDeviceDisplay/Navigation'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'

const SETTING_BUTTON_STYLE = css`
  width: 100%;
  height: 6.875rem;
  margin-bottom: ${SPACING.spacing3};
  background-color: ${COLORS.medGreyEnabled};
  padding: 1.5rem;
  border-radius: 16px;
`

export function RobotSettingsDashboard(): JSX.Element {
  const { t } = useTranslation('device_settings')
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  return (
    <Flex
      padding={`${String(SPACING.spacing6)} ${String(
        SPACING.spacingXXL
      )} ${String(SPACING.spacingXXL)}`}
      flexDirection={DIRECTION_COLUMN}
      columnGap={SPACING.spacing3}
    >
      <Navigation routes={onDeviceDisplayRoutes} />
      {/* Robot Name */}
      <RobotSettingButton
        settingName={t('robot_name')}
        settingInfo={robotName}
      />

      {/* Robot System Version */}
      <RobotSettingButton
        settingName={t('robot_system_version')}
        settingInfo={'v7.0.0'}
      />

      {/* Network Settings */}
      <RobotSettingButton
        settingName={t('network_settings')}
        settingInfo={'Not connected'}
      />

      {/* Display Sleep Settings */}
      <RobotSettingButton settingName={t('display_sleep_settings')} />

      {/* Display Brightness */}
      <RobotSettingButton settingName={t('display_brightness')} />

      {/* Display Text Size */}
      <RobotSettingButton settingName={t('display_text_size')} />

      {/* Device Reset */}
      <RobotSettingButton settingName={t('device_reset')} />

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
  settingInfo?: string
  onClick?: () => void // Note: kj 01/25/2023 optional is temp for bare-bones
}

function RobotSettingButton({
  settingName,
  settingInfo,
}: RobotSettingButtonProps): JSX.Element {
  return (
    <Btn
      css={SETTING_BUTTON_STYLE}
      onClick={() => console.log('show robot name')}
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
        <Icon name="chevron-right" size="3rem" />
      </Flex>
    </Btn>
  )
}
