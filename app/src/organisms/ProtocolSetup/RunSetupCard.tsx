import * as React from 'react'

import { Card, Text, SPACING_3 } from '@opentrons/components'

import { useTranslation } from 'react-i18next'

export function RunSetupCard(): JSX.Element {
  const { t } = useTranslation('protocol_info')

  return (
    <Card width="100%" padding={SPACING_3}>
      <Text as="h3">{t('setup_for_run')}</Text>
      {/** TODO: insert Pre Run Setup Steps here */}
    </Card>
  )
}
