import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './TitledListNotes.css'
import { truncateString } from '@opentrons/components'

interface Props {
  notes?: string | null
}

export function TitledListNotes(props: Props): JSX.Element | null {
  const truncatedNotes = truncateString(props.notes ?? '', 25)
  const { t } = useTranslation('card')
  return props.notes ? (
    <div className={styles.notes}>
      <header>{t('notes')}</header>
      {truncatedNotes}
    </div>
  ) : null
}
