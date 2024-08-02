import * as React from 'react'
import { useTranslation } from 'react-i18next'

export function StartingDeckState(): JSX.Element {
  const { t } = useTranslation('starting_deck_state')

  return <div>{t('starting_deck_state')}</div>
}
