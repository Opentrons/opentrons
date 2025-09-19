import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StatusLabel } from '/app/atoms/StatusLabel'

interface CalibrationHealthCheckResultsProps {
  isCalibrationRecommended: boolean
}

export const CalibrationHealthCheckResults = ({
  isCalibrationRecommended,
}: CalibrationHealthCheckResultsProps): JSX.Element => {
  const { t } = useTranslation('robot_calibration')
  return (
    <Flex flexDirection={DIRECTION_ROW} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <LegacyStyledText as="h1">
        {t('calibration_health_check_results')}
      </LegacyStyledText>
      <StatusLabel
        status={
          isCalibrationRecommended
            ? t('calibration_recommended')
            : t('calibration_complete')
        }
        backgroundColor={
          isCalibrationRecommended ? COLORS.yellow20 : COLORS.green20
        }
        iconColor={isCalibrationRecommended ? COLORS.yellow50 : COLORS.green50}
        textColor={COLORS.black90}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        iconSize="0.3125rem"
      ></StatusLabel>
    </Flex>
  )
}
