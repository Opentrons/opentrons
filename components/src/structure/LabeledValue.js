// @flow
// Card component with drop shadow

import * as React from 'react'
import cx from 'classnames'

import styles from './structure.css'

export type LabeledValueProps = {|
  /** Label */
  label: React.Node,
  /** Value */
  value: React.Node,
  /** Additional className */
  className?: string,
  /** Additional value className */
  valueClassName?: string,
|}

export function LabeledValue(props: LabeledValueProps) {
  const { label, value } = props
  const className = cx(styles.labeled_value, props.className)

  return (
    <div className={className}>
      <p className={styles.labeled_value_label}>{label}:</p>
      <p className={cx(styles.labeled_value_value, props.valueClassName)}>
        {value}
      </p>
    </div>
  )
}
