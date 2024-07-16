import * as React from 'react'
import { useTranslation } from 'react-i18next'

export function ProtocolOverview(): JSX.Element {
  const { t } = useTranslation('protocol_overview')

  return <div>{t('protocol_overview')}</div>
}
