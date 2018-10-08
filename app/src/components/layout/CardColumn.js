// @flow
import * as React from 'react'
import styles from './styles.css'

type Props = {
  children: React.Node,
}

export default function CardColumn (props: Props) {
  return (
    <div className={styles.column_50}>
      {props.children}
    </div>
  )
}
