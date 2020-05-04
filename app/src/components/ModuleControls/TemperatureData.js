// @flow
import * as React from 'react'
import styles from './styles.css'

type TemperatureDataProps = {|
  title: string,
  current: number | null,
  target: number | null,
  className: string,
|}

export const TemperatureData = ({
  title,
  current,
  target,
  className,
}: TemperatureDataProps) => (
  <div className={className}>
    <p className={styles.label}>{title}</p>
    <div className={styles.data_row}>
      <p className={styles.inline_labeled_value}>Current:</p>
      <p className={styles.inline_labeled_value}>{`${
        current != null ? Math.trunc(current) : '-'
      } °C`}</p>
    </div>
    <div className={styles.data_row}>
      <p className={styles.inline_labeled_value}>Target:</p>
      <p className={styles.inline_labeled_value}>{`${
        target != null ? Math.trunc(target) : '-'
      } °C`}</p>
    </div>
  </div>
)
