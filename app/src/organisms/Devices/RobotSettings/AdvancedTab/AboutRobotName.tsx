import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SPACING,
  SPACING_AUTO,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'
import { TertiaryButton } from '../../../../atoms/Buttons'

interface AboutRobotNameProps {
  robotName: string
}

export function AboutRobotName({
  robotName,
}: AboutRobotNameProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          as="h3"
          css={TYPOGRAPHY.h3SemiBold}
          marginBottom={SPACING.spacing4}
          id="AdvancedSettings_About"
        >
          {t('about_advanced')}
        </StyledText>
        <StyledText
          as="p"
          css={TYPOGRAPHY.pSemiBold}
          marginBottom={SPACING.spacing2}
        >
          {t('robot_name')}
        </StyledText>
        <StyledText as="p">{robotName}</StyledText>
      </Box>
      <TertiaryButton
        marginLeft={SPACING_AUTO}
        onClick={null} // ToDo add slideout
        id="AdvancedSettings_RenameRobot"
      >
        {t('robot_rename_button')}
      </TertiaryButton>
    </Flex>
  )
}
