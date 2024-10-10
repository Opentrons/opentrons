import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'

import {
  ALIGN_CENTER,
  Banner,
  COLORS,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TEXT_ALIGN_RIGHT,
  TYPOGRAPHY,
} from '@opentrons/components'

import { useCalibrationTaskList } from './hooks'

interface CalibrationStatusBannerProps {
  robotName: string
}

export function CalibrationStatusBanner({
  robotName,
}: CalibrationStatusBannerProps): JSX.Element | null {
  const { t } = useTranslation('robot_calibration')
  const { taskListStatus, isLoading } = useCalibrationTaskList()
  if (isLoading === true || taskListStatus === 'complete') return null
  return (
    <Banner type={taskListStatus === 'bad' ? 'warning' : 'error'} width="100%">
      <Flex
        width="100%"
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <LegacyStyledText as="p">
          {taskListStatus === 'bad'
            ? t('recalibration_recommended')
            : t('missing_calibration_data_long')}
        </LegacyStyledText>
        <RouterLink to={`/devices/${robotName}/robot-settings/calibration`}>
          <LegacyStyledText
            as="p"
            color={COLORS.black90}
            paddingRight={SPACING.spacing16}
            textAlign={TEXT_ALIGN_RIGHT}
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
          >
            {t('launch_calibration_link_text')}
          </LegacyStyledText>
        </RouterLink>
      </Flex>
    </Banner>
  )
}
