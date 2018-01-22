// @flow
import React from 'react'

import styles from './instrument.css'

type Props = {
  title: string,
  value: string,
  className?: string,
}

export default function InfoItem (props: Props) {
  const {title, value, className} = props
  return (
    <div className={className}>
      <h2 className={styles.title}>{title}</h2>
      <span className={styles.value}>{value}</span>
    </div>
  )
}
