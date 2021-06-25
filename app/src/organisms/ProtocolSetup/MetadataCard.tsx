import * as React from 'react'
import { useSelector } from 'react-redux'
import { format } from 'date-fns'

import { LabeledValue } from '../../atoms/structure'
import {
  getProtocolAuthor,
  getProtocolLastUpdated,
  getProtocolMethod,
  getProtocolDescription,
} from '../../redux/protocol'

import { Card, Flex, SPACING_2, SPACING_3 } from '@opentrons/components'

import type { State } from '../../redux/types'
import { useTranslation } from 'react-i18next'

const DATE_FORMAT = 'PPpp'

export function MetadataCard(): JSX.Element {
  const { t } = useTranslation('protocol_info')
  const author = useSelector((state: State) => getProtocolAuthor(state))
  const lastUpdated = useSelector((state: State) =>
    getProtocolLastUpdated(state)
  )
  const method = useSelector((state: State) => getProtocolMethod(state))
  const description = useSelector((state: State) =>
    getProtocolDescription(state)
  )

  return (
    <Card width="100%" padding={SPACING_3}>
      <Flex>
        <LabeledValue
          flex={3}
          label={t('organization_and_author')}
          value={author || '-'}
        />
        <LabeledValue
          flex={3}
          label={t('last_updated')}
          value={lastUpdated ? format(lastUpdated, DATE_FORMAT) : '-'}
        />
        <LabeledValue
          flex={2}
          label={t('creation_method')}
          value={method || '-'}
        />
      </Flex>
      <Flex marginTop={SPACING_2}>
        <LabeledValue
          flex={6}
          label={t('description')}
          value={description || '-'}
        />
        <LabeledValue flex={2} label={t('estimated_run_time')} value={'-'} />
      </Flex>
    </Card>
  )
}
