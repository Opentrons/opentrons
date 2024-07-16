import * as React from 'react'
import { useTranslation } from 'react-i18next'

export function ProtocolSteps(): JSX.Element {
  const { t } = useTranslation('protocol_steps')

  return <div>{t('protocol_steps')}</div>
}
