import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'

import { EmptyStateLinks } from './EmptyStateLinks'
import { ProtocolUploadInput } from './ProtocolUploadInput'

export function ProtocolsEmptyState(): JSX.Element | null {
  const { t } = useTranslation('protocol_info')
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      width="100%"
      padding={SPACING.spacing16}
      paddingTop={SPACING.spacing32}
      transform="translateY(25%)"
    >
      <LegacyStyledText role="complementary" as="h1">
        {t('import_a_file')}
      </LegacyStyledText>
      <ProtocolUploadInput />
      <EmptyStateLinks title={t('no_protocol_yet')} />
    </Flex>
  )
}
