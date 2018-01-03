// @flow
// list alert items
import * as React from 'react'
import styles from './lists.css'

type ListAlertProps = {
  className?: string,
  children?: React.Node
}

export default function ListAlert (props: ListAlertProps) {
  return (
    <li className={styles.alert}>{props.children}</li>
  )
}
