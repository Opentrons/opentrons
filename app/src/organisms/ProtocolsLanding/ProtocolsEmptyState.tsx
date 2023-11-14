import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { ProtocolUploadInput } from './ProtocolUploadInput'
import { EmptyStateLinks } from './EmptyStateLinks'
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
      <StyledText role="complementary" as="h1">
        {t('import_a_file')}
      </StyledText>
      <ProtocolUploadInput />
      <EmptyStateLinks title={t('no_protocol_yet')} />
    </Flex>
  )
}
