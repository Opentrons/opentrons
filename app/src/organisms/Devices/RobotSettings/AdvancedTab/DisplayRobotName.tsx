import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_AUTO,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '../../../../atoms/buttons'
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

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    if (!isRobotBusy) {
      updateIsExpanded(true, 'renameRobot')
    }
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          as="h2"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing16}
          id="AdvancedSettings_About"
        >
          {t('about_advanced')}
        </StyledText>
        <StyledText
          as="p"
          css={TYPOGRAPHY.pSemiBold}
          marginBottom={SPACING.spacing4}
        >
          {t('robot_name')}
        </StyledText>
        <StyledText as="p" color={COLORS.grey60}>
          {robotName}
        </StyledText>
      </Box>
      <TertiaryButton
        marginLeft={SPACING_AUTO}
        onClick={handleClick}
        id="RobotSettings_RenameRobot"
        disabled={isRobotBusy}
      >
        {t('rename_robot')}
      </TertiaryButton>
    </Flex>
  )
}
