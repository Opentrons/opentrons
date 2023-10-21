import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  COLORS,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { StatusLabel } from '../../../atoms/StatusLabel'

interface CalibrationHealthCheckResultsProps {
  isCalibrationRecommended: boolean
}

export const CalibrationHealthCheckResults = ({
  isCalibrationRecommended,
}: CalibrationHealthCheckResultsProps): JSX.Element => {
  const { t } = useTranslation('robot_calibration')
  return (
    <Flex flexDirection={DIRECTION_ROW} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <StyledText as="h1">{t('calibration_health_check_results')}</StyledText>
      <StatusLabel
        status={
          isCalibrationRecommended
            ? t('calibration_recommended')
            : t('calibration_complete')
        }
        backgroundColor={
          isCalibrationRecommended
            ? COLORS.warningBackgroundLight
            : COLORS.successBackgroundLight
        }
        iconColor={
          isCalibrationRecommended
            ? COLORS.warningEnabled
            : COLORS.successEnabled
        }
        textColor={COLORS.darkBlackEnabled}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        iconSize="0.3125rem"
      ></StatusLabel>
    </Flex>
  )
}
