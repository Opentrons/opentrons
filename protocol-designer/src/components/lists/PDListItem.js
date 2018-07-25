// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

type Props = {
  className?: ?string,
  border?: ?boolean,
}

/** Light wrapper around li for PD-specific styles */
export default function PDListItem (props: Props) {
  const className = cx(
    {
      [styles.border]: props.border
    },
    styles.pd_list_item,
    props.className
  )
  return <li {...props} className={className} />
}
