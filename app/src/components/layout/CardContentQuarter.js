// @flow
import * as React from 'react'
import styles from './styles.css'

type Props = {
  children: React.Node,
}
export default function CardContentQuarter (props: Props) {
  return (
    <div className={styles.card_content_25}>
      {props.children}
    </div>
  )
}
