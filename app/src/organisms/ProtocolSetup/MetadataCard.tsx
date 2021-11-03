import * as React from 'react'
import { format } from 'date-fns'
import {
  Card,
  Flex,
  SPACING_2,
  SPACING_3,
  C_WHITE,
} from '@opentrons/components'
import { LabeledValue } from '../../atoms/structure'

import { useProtocolMetadata } from './hooks'
import { useTranslation } from 'react-i18next'

const DATE_FORMAT = 'PPpp'

export function MetadataCard(): JSX.Element {
  const { t } = useTranslation('protocol_info')
  const { author, lastUpdated, method, description } = useProtocolMetadata()

  return (
    <Card width="100%" padding={SPACING_3} backgroundColor={C_WHITE}>
      <Flex>
        <LabeledValue
          flex={3}
          label={t('organization_and_author')}
          value={author || '-'}
          id={'MetadataCard_protocolOrganizationAuthor'}
        />
        <LabeledValue
          flex={3}
          label={t('last_updated')}
          value={lastUpdated ? format(lastUpdated, DATE_FORMAT) : '-'}
          id={'MetadataCard_protocolLastUpdated'}
        />
        <LabeledValue
          flex={2}
          label={t('creation_method')}
          value={method || '-'}
          id={'MetadataCard_protocolCreationMethod'}
        />
      </Flex>
      <Flex marginTop={SPACING_2}>
        <LabeledValue
          flex={6}
          label={t('description')}
          value={description || '-'}
          id={'MetadataCard_protocolDescription'}
        />
        {/* <LabeledValue TODO: add estimated run time back in when ready
          flex={2}
          label={t('estimated_run_time')}
          value={'-'}
          id={'MetadataCard_protocolEstRunTime'}
        /> */}
      </Flex>
    </Card>
  )
}
