import * as React from 'react'
import { useSelector } from 'react-redux'
import { format } from 'date-fns'

import {
  getProtocolName,
  getProtocolAuthor,
  getProtocolLastUpdated,
  getProtocolMethod,
  getProtocolDescription,
} from '../../redux/protocol'

import { LabeledValue, Card, Text, Flex, JUSTIFY_SPACE_BETWEEN, SPACING_3 } from '@opentrons/components'

import type { State } from '../../redux/types'
import { useTranslation } from 'react-i18next'

const DATE_FORMAT = 'PPpp'

export function MetadataCard(): JSX.Element {
  const { t } = useTranslation('protocol_info')
  const name = useSelector((state: State) => getProtocolName(state))
  const author = useSelector((state: State) => getProtocolAuthor(state))
  const lastUpdated = useSelector((state: State) => getProtocolLastUpdated(state))
  const method = useSelector((state: State) => getProtocolMethod(state))
  const description = useSelector((state: State) => getProtocolDescription(state))

  return (
    <Card width="100%" padding={SPACING_3}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <LabeledValue label={t('organization_and_author')} value={author || '-'} />
        <LabeledValue label={t('last_updated')} value={lastUpdated ? format(lastUpdated, DATE_FORMAT) : '-'} />
        <LabeledValue label={t('creation_method')} value={method || '-'} />
      </Flex>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <LabeledValue label={t('description')} value={description || '-'} />
        <LabeledValue label={t('estimated_run_time')} value={'-'} />
      </Flex>
    </Card>
  )
}
