import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Text,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  SPACING,
} from '@opentrons/components'

import { UploadInput } from './UploadInput'
import { EmptyStateLinks } from './EmptyStateLinks'
export function ProtocolsEmptyState(): JSX.Element | null {
  const { t } = useTranslation('protocol_info')
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      width="100%"
      padding={SPACING.spacing4}
      paddingTop={SPACING.spacing6}
    >
      <Text role="complementary" as="h4">
        {t('import_a_file')}
      </Text>
      <UploadInput
        onUpload={() => {
          console.log('todo')
        }}
      />
      <EmptyStateLinks title={t('no_protocol_yet')} />
    </Flex>
  )
}
