import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'

import {
  Flex,
  Link,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
  COLORS,
  COLORS,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  ALIGN_FLEX_START,
} from '@opentrons/components'

import { TertiaryButton } from '../../atoms/buttons'
import { StatusLabel } from '../../atoms/StatusLabel'
import { StyledText } from '../../atoms/text'

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
  let statusLabelIconColor: string = COLORS.red50
  let statusLabelText = t('missing_calibration_data')

  // if the tasklist is empty, though, all calibrations are good
  if (taskListStatus === 'complete') {
    statusLabelBackgroundColor = COLORS.green30
    statusLabelIconColor = COLORS.green50
    statusLabelText = t('calibration_complete')
    // if we have tasks and they are all marked bad, then we should
    // strongly suggest they re-do those calibrations
  } else if (taskListStatus === 'bad') {
    statusLabelBackgroundColor = COLORS.yellow30
    statusLabelIconColor = COLORS.yellow50
    statusLabelText = t('calibration_recommended')
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      border={BORDERS.lineBorder}
      borderRadius={BORDERS.radiusSoftCorners}
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
          <StyledText css={TYPOGRAPHY.h2SemiBold}>
            {t('calibration_status')}
          </StyledText>
          <StatusLabel
            status={statusLabelText}
            backgroundColor={statusLabelBackgroundColor}
            iconColor={statusLabelIconColor}
            textColor={COLORS.black90}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            iconSize="0.313rem"
          />
        </Flex>
        <StyledText as="p">{t('calibration_status_description')}</StyledText>
        <Link
          role="button"
          css={TYPOGRAPHY.darkLinkLabelSemiBold}
          onClick={() => setShowHowCalibrationWorksModal(true)}
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
