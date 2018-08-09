// @flow
import * as React from 'react'
import styles from './styles.css'

type Props = {
  children: React.Node,
}
export default function CardContentFull (props: Props) {
  return (
    <div className={styles.card_content_full}>
      {props.children}
    </div>
  )
}
