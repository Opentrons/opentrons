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
  isCalibrationCompleted: boolean
}

export const CalibrationHealthCheckResults = ({
  isCalibrationCompleted,
}: CalibrationHealthCheckResultsProps): JSX.Element => {
  const { t } = useTranslation('robot_calibration')
  return (
    <Flex flexDirection={DIRECTION_ROW} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <StyledText css={TYPOGRAPHY.h1Default}>
        {t('calibration_health_check_results')}
      </StyledText>
      <StatusLabel
        status={
          isCalibrationCompleted
            ? t('calibration_complete')
            : t('calibration_recommended')
        }
        backgroundColor={
          isCalibrationCompleted
            ? COLORS.successBackgroundLight
            : COLORS.warningBackgroundLight
        }
        iconColor={
          isCalibrationCompleted ? COLORS.successEnabled : COLORS.warningEnabled
        }
        textColor={COLORS.darkBlackEnabled}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        iconSize="0.3125rem"
      ></StatusLabel>
    </Flex>
  )
}
