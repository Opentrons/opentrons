import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  Icon,
  SIZE_1,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

interface RenderResultProps {
  isBadCal: boolean
}

export const RenderResult = ({ isBadCal }: RenderResultProps): JSX.Element => {
  const { t } = useTranslation('robot_calibration')

  return (
    <Flex alignItems={ALIGN_CENTER}>
      <LegacyStyledText
        color={isBadCal ? COLORS.yellow60 : COLORS.green60}
        marginRight={SPACING.spacing8}
      >
        {isBadCal ? t('recalibration_recommended') : t('good_calibration')}
      </LegacyStyledText>
      <Icon
        name={isBadCal ? 'alert-circle' : 'check-circle'}
        size={SIZE_1}
        color={isBadCal ? COLORS.yellow50 : COLORS.green50}
        marginRight={SPACING.spacing12}
        data-testid="RenderResult_icon"
      />
    </Flex>
  )
}
