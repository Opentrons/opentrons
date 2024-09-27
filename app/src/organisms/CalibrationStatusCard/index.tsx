import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'
import { StatusLabel } from '/app/atoms/StatusLabel'

import { useCalibrationTaskList } from '../Devices/hooks'

export interface CalibrationStatusCardProps {
  robotName: string
  setShowHowCalibrationWorksModal: (
    showHowCalibrationWorksModal: boolean
  ) => void
}

export function CalibrationStatusCard({
  robotName,
  setShowHowCalibrationWorksModal,
}: CalibrationStatusCardProps): JSX.Element {
  const { t } = useTranslation('robot_calibration')
  const { taskListStatus } = useCalibrationTaskList()

  // start off assuming we are missing calibrations
  let statusLabelBackgroundColor: string = COLORS.red30
  let statusLabelIconColor: string = COLORS.red60
  let statusLabelText = t('missing_calibration_data')
  let statusLabelTextColor = COLORS.red60

  // if the tasklist is empty, though, all calibrations are good
  if (taskListStatus === 'complete') {
    statusLabelBackgroundColor = COLORS.green30
    statusLabelIconColor = COLORS.green60
    statusLabelText = t('calibration_complete')
    statusLabelTextColor = COLORS.green60
    // if we have tasks and they are all marked bad, then we should
    // strongly suggest they re-do those calibrations
  } else if (taskListStatus === 'bad') {
    statusLabelBackgroundColor = COLORS.yellow30
    statusLabelIconColor = COLORS.yellow60
    statusLabelText = t('calibration_recommended')
    statusLabelTextColor = COLORS.yellow60
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      border={BORDERS.lineBorder}
      borderRadius={BORDERS.borderRadius4}
      padding={SPACING.spacing16}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_FLEX_START}
        justifyContent={JUSTIFY_CENTER}
        gridGap={SPACING.spacing8}
        marginRight={SPACING.spacing40}
      >
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
          <LegacyStyledText css={TYPOGRAPHY.h2SemiBold}>
            {t('calibration_status')}
          </LegacyStyledText>
          <StatusLabel
            status={statusLabelText}
            backgroundColor={statusLabelBackgroundColor}
            iconColor={statusLabelIconColor}
            textColor={statusLabelTextColor}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            iconSize="0.313rem"
          />
        </Flex>
        <LegacyStyledText as="p">
          {t('calibration_status_description')}
        </LegacyStyledText>
        <Link
          role="button"
          css={TYPOGRAPHY.darkLinkLabelSemiBold}
          onClick={() => {
            setShowHowCalibrationWorksModal(true)
          }}
        >
          {t('see_how_robot_calibration_works')}
        </Link>
      </Flex>
      <RouterLink
        to={`/devices/${robotName}/robot-settings/calibration/dashboard`}
      >
        <TertiaryButton>{t('launch_calibration')}</TertiaryButton>
      </RouterLink>
    </Flex>
  )
}
