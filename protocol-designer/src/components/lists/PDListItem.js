// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

type Props = {
  className?: ?string
}

/** Light wrapper around li for PD-specific styles */
export default function PDListItem (props: Props) {
  return <li {...props} className={cx(styles.pd_list_item, props.className)} />
}
