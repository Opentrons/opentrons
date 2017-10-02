// task component
import React from 'react'
import styles from './Page.css'

export default function Page (props) {
  return (
    <main className={styles.task}>
      {props.children}
    </main>
  )
}
