import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

export function Loading(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      gridGap={SPACING.spacing16}
      height="100vh"
    >
      <LegacyStyledText as="h3">{t('loading')}</LegacyStyledText>
      <Icon name="ot-spinner" size="3rem" spin />
    </Flex>
  )
}
