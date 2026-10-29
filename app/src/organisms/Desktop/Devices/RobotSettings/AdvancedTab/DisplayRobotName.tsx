import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  SPACING_AUTO,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'

import type { MouseEventHandler, ReactNode } from 'react'

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
}: DisplayRobotNameProps): ReactNode {
  const { t } = useTranslation('device_settings')

  const handleClick: MouseEventHandler<HTMLButtonElement> = () => {
    if (!isRobotBusy) {
      updateIsExpanded(true, 'renameRobot')
    }
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          forwardedAs="h2"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing16}
        >
          {t('about_advanced')}
        </StyledText>
        <StyledText
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          forwardedAs="p"
          marginBottom={SPACING.spacing4}
        >
          {t('robot_name')}
        </StyledText>
        <StyledText forwardedAs="p" color={COLORS.grey60}>
          {robotName}
        </StyledText>
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
