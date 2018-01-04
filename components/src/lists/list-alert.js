// @flow
// list alert items
import * as React from 'react'
import classnames from 'classnames'
import styles from './lists.css'

type ListAlertProps = {
  className?: string,
  children?: React.Node
}

export default function ListAlert (props: ListAlertProps) {
const className = classnames(styles.alert, props.className)
  return (
    <li className={className}>{props.children}</li>
  )
}
