// @flow
// Card component with drop shadow

import * as React from 'react'
import cx from 'classnames'

import styles from './structure.css'

type Props = {
  /** Label */
  label: React.Node,
  /** Value */
  value: React.Node,
  /** Additional className */
  className?: string,
}

export default function LabeledValue (props: Props) {
  const {label, value} = props
  const className = cx(styles.labeled_value, props.className)

  return (
    <div className={className}>
      <p className={styles.labeled_value_label}>
        {label}:
      </p>
      <p className={styles.labeled_value_value}>
        {value}
      </p>
    </div>
  )
}
