// @flow
// ListAlert component to be used as the first child of a TitleList
// TODO(mc, 2020-02-19): this component doesn't appear to be used
// can it be removed?
import * as React from 'react'
import classnames from 'classnames'
import styles from './lists.css'

export type ListAlertProps = {|
  /** additional classes to apply */
  className?: string,
  /** contents of ListAlert (usually plain text) */
  children?: React.Node,
|}

/**
 * A List item to be used for alerts
 */
export function ListAlert(props: ListAlertProps) {
  const className = classnames(styles.list_alert, props.className)
  return <li className={className}>{props.children}</li>
}
