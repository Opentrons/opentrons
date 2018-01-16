// @flow
// TitleBar component

import * as React from 'react'

import styles from './structure.css'

type Props = {
  title: React.Node,
  subtitle?: React.Node
}

export default function TitleBar (props: Props) {
  const {title, subtitle} = props

  const separator = subtitle && (
    <span className={styles.separator}>
      |
    </span>
  )

  const subheading = subtitle && (
    <h2 className={styles.subtitle}>
      {subtitle}
    </h2>
  )

  return (
    <header className={styles.title_bar}>
      <h1 className={styles.title}>
        {title}
      </h1>
      {separator}
      {subheading}
    </header>
  )
}
