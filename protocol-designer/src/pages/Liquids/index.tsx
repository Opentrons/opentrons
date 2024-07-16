import * as React from 'react'
import { useTranslation } from 'react-i18next'

export function Liquids(): JSX.Element {
  const { t } = useTranslation('liquids')
  return <div>{t('liquids')}</div>
}
