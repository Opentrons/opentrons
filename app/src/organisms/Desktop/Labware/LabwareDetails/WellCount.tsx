import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  LegacyStyledText,
} from '@opentrons/components'

export interface WellCountProps {
  count: number
  wellLabel: string
}

export function WellCount(props: WellCountProps): JSX.Element {
  const { t } = useTranslation('labware_details')
  const { count, wellLabel } = props

  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      marginBottom={SPACING.spacing16}
    >
      <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t(wellLabel)} {t('count')}
      </LegacyStyledText>
      <LegacyStyledText as="p">{count}</LegacyStyledText>
    </Flex>
  )
}
