import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  SPACING,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'

import { StyledText } from '../../atoms/text'
import { EmptyStateLinks } from './EmptyStateLinks'
import { UploadInput } from './UploadInput'

export function ProtocolsEmptyState(): JSX.Element | null {
  const { t } = useTranslation('protocol_info')
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      width="100%"
      padding={SPACING.spacing4}
      paddingTop={SPACING.spacing6}
      transform="translateY(25%)"
    >
      <StyledText role="complementary" as="h1">
        {t('import_a_file')}
      </StyledText>
      <UploadInput />
      <EmptyStateLinks title={t('no_protocol_yet')} />
    </Flex>
  )
}
