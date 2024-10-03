import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

export function CheckUpdates(): JSX.Element {
  const { t } = useTranslation('device_settings')
  return (
    <Flex
      backgroundColor={COLORS.grey35}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing40}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      height="32.5rem"
      borderRadius={BORDERS.borderRadius12}
    >
      <Icon name="ot-spinner" size="5rem" spin color={COLORS.grey60} />
      <LegacyStyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
        {t('checking_for_updates')}
      </LegacyStyledText>
    </Flex>
  )
}
