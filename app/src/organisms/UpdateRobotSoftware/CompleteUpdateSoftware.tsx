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
  BORDERS,
  TYPOGRAPHY,
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
        backgroundColor={COLORS.darkBlack20}
        height="33rem"
        gridGap={SPACING.spacing40}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        borderRadius={BORDERS.borderRadiusSize3}
      >
        <StyledText
          as="h2"
          fontWeight={TYPOGRAPHY.fontWeightBold}
          color={COLORS.black}
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
