// @flow
import * as React from 'react'
import styles from './styles.css'

type Props = {
  children: React.Node,
}
export default function CardContentFlex (props: Props) {
  return (
    <div className={styles.card_content_flex}>
      {props.children}
    </div>
  )
}
