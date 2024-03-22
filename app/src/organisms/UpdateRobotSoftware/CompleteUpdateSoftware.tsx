import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

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
        backgroundColor={COLORS.grey35}
        height="33rem"
        gridGap={SPACING.spacing40}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        borderRadius={BORDERS.borderRadius12}
      >
        <StyledText
          as="h2"
          fontWeight={TYPOGRAPHY.fontWeightBold}
          color={COLORS.black90}
        >
          {t('update_complete')}
        </StyledText>
        <StyledText as="h3" marginTop={SPACING.spacing16}>
          {t('restarting_robot')}
        </StyledText>
        <Box width="47.5rem">
          <ProgressBar percentComplete={100} />
        </Box>
      </Flex>
    </Flex>
  )
}
