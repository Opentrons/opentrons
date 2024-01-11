import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  ALIGN_CENTER,
  Icon,
  COLORS,
  LEGACY_COLORS,
  SPACING,
  SIZE_1,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'

interface RenderResultProps {
  isBadCal: boolean
}

export const RenderResult = ({ isBadCal }: RenderResultProps): JSX.Element => {
  const { t } = useTranslation('robot_calibration')

  return (
    <Flex alignItems={ALIGN_CENTER}>
      <StyledText
        color={isBadCal ? LEGACY_COLORS.warningText : LEGACY_COLORS.successText}
        marginRight={SPACING.spacing8}
      >
        {isBadCal ? t('recalibration_recommended') : t('good_calibration')}
      </StyledText>
      <Icon
        name={isBadCal ? 'alert-circle' : 'check-circle'}
        size={SIZE_1}
        color={isBadCal ? LEGACY_COLORS.warningEnabled : COLORS.green50}
        marginRight={SPACING.spacing12}
        data-testid="RenderResult_icon"
      />
    </Flex>
  )
}
