import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  COLORS,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  Box,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { ProgressBar } from '../../atoms/ProgressBar'

interface CompleteUpdateSoftwareProps {
  robotName: string
}
export function CompleteUpdateSoftware({
  robotName,
}: CompleteUpdateSoftwareProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'robot_controls'])

  return (
    <Flex flexDirection={DIRECTION_COLUMN} width="100%">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.darkGreyDisabled}
        height="33rem"
        gridGap={SPACING.spacingXXL}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <StyledText
          fontSize="2rem"
          lineHeight="2.75rem"
          fontWeight="700"
          color={COLORS.black}
        >
          {t('update_complete')}
        </StyledText>
        <StyledText
          marginTop={SPACING.spacing4}
          fontSize="1.5rem"
          lineHeight="2.0625rem"
          fontWeight="400"
        >
          {t('restarting_robot')}
        </StyledText>
        <Box width="47.5rem">
          <ProgressBar percentComplete={100} />
        </Box>
      </Flex>
    </Flex>
  )
}
