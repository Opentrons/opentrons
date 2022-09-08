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
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  ALIGN_FLEX_START,
} from '@opentrons/components'

import { TertiaryButton } from '../../atoms/buttons'
import { StatusLabel } from '../../atoms/StatusLabel'
import { StyledText } from '../../atoms/text'

export interface CalibrationStatusCardProps {
  robotName: string
  setShowDeckCalibrationModal: (showDeckCalibrationModal: boolean) => void
}

export function CalibrationStatusCard({
  robotName,
  setShowDeckCalibrationModal,
}: CalibrationStatusCardProps): JSX.Element {
  const { t } = useTranslation('robot_calibration')

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      border={BORDERS.lineBorder}
      borderRadius={BORDERS.radiusSoftCorners}
      padding={SPACING.spacing4}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_FLEX_START}
        justifyContent={JUSTIFY_CENTER}
        gridGap={SPACING.spacing3}
        marginRight={SPACING.spacingXXL}
      >
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing3}>
          <StyledText css={TYPOGRAPHY.h2SemiBold}>
            {t('calibration_status')}
          </StyledText>
          <StatusLabel
            status={t('missing_calibration_data')}
            backgroundColor={`${COLORS.errorEnabled}${COLORS.opacity12HexCode}`}
            iconColor={COLORS.errorEnabled}
            textColor={COLORS.darkBlackEnabled}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          />
        </Flex>
        <StyledText as="p">{t('calibration_status_description')}</StyledText>
        <Link
          role="button"
          css={TYPOGRAPHY.darkLinkLabelSemiBold}
          onClick={() => setShowDeckCalibrationModal(true)}
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
