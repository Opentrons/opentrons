import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './TitledListNotes.css'

interface Props {
  notes?: string | null
}

export function TitledListNotes(props: Props): JSX.Element | null {
  const { t } = useTranslation('card')
  return props.notes ? (
    <div className={styles.notes}>
      <header>{t('notes')}</header>
      {props.notes}
    </div>
  ) : null
}
