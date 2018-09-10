// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

type Props = {
  /** Title for the card */
  title: string,
  /** Card Content, each child will be separated with a grey bottom border */
  children: React.Node,
  /** Optional className for card contents */
  className?: string,
}

// TODO (ka 2018-7-24): This component should be replaced with refactored refresh card
export default function StatusCard (props: Props) {
  return (
    <div className={styles.status_card}>
      <h3 className={styles.card_title}>{props.title}</h3>
      <div className={cx(styles.card_contents, props.className)}>
        {props.children}
      </div>
    </div>
  )
}
