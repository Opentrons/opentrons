import { i18n } from '../localization'
import * as React from 'react'
import styles from './TitledListNotes.css'
import { truncateString } from '@opentrons/components'

interface Props {
  notes?: string | null
}

export function TitledListNotes(props: Props): JSX.Element | null {
  const truncatedNotes = truncateString(props.notes ?? '', 25)
  return props.notes ? (
    <div className={styles.notes}>
      <header>{i18n.t('card.notes')}</header>
      {truncatedNotes}
    </div>
  ) : null
}
