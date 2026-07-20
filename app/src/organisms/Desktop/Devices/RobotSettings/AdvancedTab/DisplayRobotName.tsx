import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  SPACING_AUTO,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'

import type { MouseEventHandler } from 'react'

interface DisplayRobotNameProps {
  robotName: string
  updateIsExpanded: (
    isExpanded: boolean,
    type: 'deviceReset' | 'renameRobot'
  ) => void
  isRobotBusy: boolean
}

export function DisplayRobotName({
  robotName,
  updateIsExpanded,
  isRobotBusy,
}: DisplayRobotNameProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  const handleClick: MouseEventHandler<HTMLButtonElement> = () => {
    if (!isRobotBusy) {
      updateIsExpanded(true, 'renameRobot')
    }
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <LegacyStyledText
          forwardedAs="h2"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing16}
        >
          {t('about_advanced')}
        </LegacyStyledText>
        <LegacyStyledText
          forwardedAs="p"
          css={TYPOGRAPHY.pSemiBold}
          marginBottom={SPACING.spacing4}
        >
          {t('robot_name')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p" color={COLORS.grey60}>
          {robotName}
        </LegacyStyledText>
      </Box>
      <TertiaryButton
        marginLeft={SPACING_AUTO}
        onClick={handleClick}
        disabled={isRobotBusy}
      >
        {t('rename_robot')}
      </TertiaryButton>
    </Flex>
  )
}
