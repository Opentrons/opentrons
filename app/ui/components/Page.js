// task component
import React from 'react'
import classnames from 'classnames'

import styles from './Page.css'

const STYLE = classnames('relative', styles.task)

export default function Page (props) {
  return (
    <main className={STYLE}>
      {props.children}
    </main>
  )
}
