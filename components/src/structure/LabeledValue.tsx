// Card component with drop shadow

import * as React from 'react'
import cx from 'classnames'

import styles from './structure.module.css'

export interface LabeledValueProps {
  /** Label */
  label: React.ReactNode
  /** Value */
  value: React.ReactNode
  /** Additional className */
  className?: string
  /** Additional value className */
  valueClassName?: string
}

export function LabeledValue(props: LabeledValueProps): JSX.Element {
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
