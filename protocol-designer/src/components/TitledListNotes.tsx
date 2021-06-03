// @flow
import { i18n } from '../localization'
import * as React from 'react'
import styles from './TitledListNotes.css'

type Props = {|
  notes: ?string,
|}

export function TitledListNotes(props: Props): React.Node {
  return props.notes ? (
    <div className={styles.notes}>
      <header>{i18n.t('card.notes')}</header>
      {props.notes}
    </div>
  ) : null
}
