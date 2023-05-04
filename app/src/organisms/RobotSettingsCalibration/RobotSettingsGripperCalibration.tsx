import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

export function RobotSettingsGripperCalibration(): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <Box paddingTop={SPACING.spacing24} paddingBottom={SPACING.spacing4}>
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Box marginRight={SPACING.spacing32}>
          <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing8}>
            {t('gripper_calibration_title')}
          </Box>
          <StyledText as="p" marginBottom={SPACING.spacing8}>
            {t('gripper_calibration_description')}
          </StyledText>
        </Box>
      </Flex>
    </Box>
  )
}
